import fs from 'fs';
import path from 'path';
import { MongoTests } from '@/models/mongo';
import { SSH } from '@/services';
import redis from '@/tools/redis';
import { log } from '@/configs';
import Redis from 'ioredis';

export const redisRecordKey = (recordId: string) => `task:record:${recordId}`;

export const subChannelKey = (recordId: string) => `task:record:${recordId}:sub`;


export const RemoteSSHTask = new class SSHTask {
	private taskTempData: Record<`record:${string}`, { ranking: number, isStop: boolean }> = {};
	private timer: NodeJS.Timeout | null = null;
	constructor() {
		this.autoRun();
	}

	private async autoRun() {
		const recordId = await this.getExecuteRecord();

		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		if (recordId) {
			this.excuteRecord(recordId);
			this.timer = setTimeout(async () => {
				this.autoRun();
			}, 4 * 1000)
		} else {
			this.timer = setTimeout(async () => {
				this.autoRun();
			}, 20 * 1000)
		}
	}

	async generateTaskRecord(taskId: string) {
		const latestRunningRecord = await MongoTests.findOne({
			type: 'remote-ssh-task-record',
			'data.status': { $nin: ['stoped', 'finished'] },
			'data.taskId': taskId
		}) as TestTaskRecord;

		if (latestRunningRecord) {
			return latestRunningRecord;
		}
		return await MongoTests.insertOne({
			type: 'remote-ssh-task-record',
			data: {
				status: 'waiting',
				taskId
			}
		} as TestTaskRecord) as TestTaskRecord;
	}

	async getTaskDevice(): Promise<{ host: string, port: number, username: string, password: string }> {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve({
					host: '10.4.48.13',
					port: 22,
					username: 'liuhaifeng',
					password: ''
				})
			}, 500)
		});
	}

	async publishLog(log: string, recordId: string) {
		if (this.taskTempData[`record:${recordId}`].isStop) {
			return;
		}
		const redisKey = redisRecordKey(recordId);
		const subKey = subChannelKey(recordId);

		await redis.server?.rpush(redisKey, log);
		await redis.server?.publish(subKey, `[ranking]:${this.taskTempData[`record:${recordId}`].ranking}`)
		await redis.server?.publish(subKey, log);
		this.taskTempData[`record:${recordId}`].ranking++;

		if (log.includes('[stop]')) {
			this.taskTempData[`record:${recordId}`].isStop = true;
		}
	}

	async subTaskStopSignal(recordId: string) {
		let subServer: Redis | null | undefined = redis.server?.duplicate();
		const subKey = subChannelKey(recordId);

		await subServer?.subscribe(subKey);
		subServer?.on('message', async (channel, message) => {
			if (channel !== subKey) {
				return;
			}
			if (message.includes('[stop]')) {
				await this.publishLog('[stop]\n', recordId);
				subServer?.quit();
				subServer = null;
			}
		});
	}

	async getExecuteRecord() {
		const limitForEachInstance = 10;
		const instance = process.env.INSTANCEID;
		const runningCount = await MongoTests.find({
			type: 'remote-ssh-task-record',
			'data.status': { $in: ['running', 'handling'] },
			'data.instance': instance
		});

		if (runningCount.length >= limitForEachInstance) {
			return;
		}
		const record = await MongoTests.findOneAndUpdate({
			type: 'remote-ssh-task-record',
			'data.status': 'waiting'
		}, {
			$set: {
				'data.status': 'handling',
				'data.instance': instance
			}
		}, { sort: { createdAt: 'desc' } }) as TestTaskRecord;

		if (!record) {
			return;
		}
		return record._id.toString();
	}

	async excuteRecord(recordId: string) {
		const device = await this.getTaskDevice();

		if (!device) {
			await MongoTests.findOneAndUpdate({ _id: recordId }, {
				$set: {
					'data.status': 'waiting',
					'data.instance': ''
				}
			})
			return;
		}
		if (!this.taskTempData[`record:${recordId}`]) {
			this.taskTempData[`record:${recordId}`] = {
				ranking: 0,
				isStop: false
			};
		}
		const instance = process.env.INSTANCEID;
		const taskRecord = await MongoTests.findById(recordId) as TestTaskRecord;
		const commands = (await MongoTests.findOne({
			type: 'remote-ssh-task-data',
			_id: taskRecord.data.taskId
		}) as TestTaskData).data.commands;
		const ssh = new SSH();

		await ssh.connect(device);

		await MongoTests.findOneAndUpdate({ _id: recordId }, {
			$set: {
				'data.status': 'running',
				'data.instance': instance
			}
		})
		await this.subTaskStopSignal(recordId);
		const dealEnd = async () => {
			ssh.close();
			await this.dealTaskResult(recordId, taskRecord.data.taskId);
		};
		const loop = async (cmd: string) => {
			if (this.taskTempData[`record:${recordId}`].isStop) {
				return await dealEnd();
			}
			await this.publishLog(`[command]:${cmd}\n`, taskRecord._id.toString());

			ssh.exec(cmd, async stream => {
				if (!stream) {
					const command = commands.shift();

					if (command) {
						await loop(command);
					} else {
						await dealEnd();
					}
				} else {
					stream.on('close', async () => {
						if (this.taskTempData[`record:${recordId}`].isStop) {
							return await dealEnd();
						}
						if (commands.length === 0) {
							await dealEnd();
						} else {
							const command = commands.shift();

							if (command) {
								await loop(command);
							} else {
								await dealEnd();
							}
						}
					}).on('data', async (data: Buffer) => {
						if (this.taskTempData[`record:${recordId}`].isStop) {
							return await dealEnd();
						}
						await this.publishLog(data.toString(), taskRecord._id.toString());
					}).stderr.on('data', async (data) => {
						if (this.taskTempData[`record:${recordId}`].isStop) {
							return await dealEnd();
						}
						await this.publishLog(data.toString(), taskRecord._id.toString());
					});
				}
			});
		};

		const command = commands.shift();

		if (command) {
			await loop(command);
		}
	}

	async dealTaskResult(recordId: string, taskId: string) {
		const logFileDirPath = path.resolve(__dirname, `../../../../../task-data/${taskId}`);

		fs.mkdirSync(logFileDirPath, { recursive: true });
		const logFilePath = path.resolve(logFileDirPath, `${new Date().getTime()}.log`);
		const redisKey = redisRecordKey(recordId);
		const count = await redis.server?.llen(redisKey);

		if (count) {
			const writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });

			writeStream.once('open', async () => {
				for (let i = 0; i < count; i++) {
					const data = await redis.server?.lindex(redisKey, i);

					writeStream.write(data as string);
				}

				writeStream.end();
			})

			writeStream.on('close', async () => {
				// 结果上传oss
				// const ossAddress = await oss.uploadFile(logFilePath, `${taskId}/${path.basename(logFilePath)}`);
				await MongoTests.updateOne({
					'data.taskId': taskId,
					'data.status': 'running',
					'data.instance': process.env.INSTANCEID,
					type: 'remote-ssh-task-record'
				}, {
					$set: {
						'data.status': this.taskTempData[`record:${recordId}`].isStop ? 'stoped' : 'finished',
						'data.result': logFilePath,
						'data.instance': ''
					}
				});
				await redis.server?.ltrim(redisKey, 1, 0)
				log('master-process').info(`任务执行结束，结束状态为: ${this.taskTempData[`record:${recordId}`].isStop ? '被中断' : '成功'}`);
				delete this.taskTempData[`record:${recordId}`];
			})
		}
	}
}

export const RemoteSSHFrame = new class SSHFrame {
	constructor() {

	}

	// async addTask(record: TestTaskRecord) {

	// }
}
