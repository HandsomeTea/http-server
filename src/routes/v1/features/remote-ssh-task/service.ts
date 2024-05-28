import fs from 'fs';
import path from 'path';
import Queue from 'bull';
import { MongoTests } from '@/models/mongo';
import { SSH } from '@/services';
import redis from '@/tools/redis';
import { getENV, log } from '@/configs';
import Redis from 'ioredis';

export const redisRecordKey = (recordId: string) => `task:record:${recordId}`;

export const subChannelKey = (recordId: string) => `task:record:${recordId}:sub`;

interface Device {
	host: string
	port: number
	username: string
	password: string
}
export const RemoteSSHTaskService = new class SSHTask {
	public taskTempData: Record<`record:${string}`, { ranking: number, isStop: boolean }> = {};
	private timer: NodeJS.Timeout | null = null;

	constructor() {
		// this.autoRun();
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
			}, 30 * 1000)
		}
	}

	async generateTaskRecord(taskId: string) {
		// const latestRunningRecord = await MongoTests.findOne({
		// 	type: 'remote-ssh-task-record',
		// 	'data.status': { $nin: ['stoped', 'finished'] },
		// 	'data.taskId': taskId
		// }) as TestTaskRecord;

		// if (latestRunningRecord) {
		// 	return latestRunningRecord;
		// }

		return await MongoTests.insertOne({
			type: 'remote-ssh-task-record',
			data: {
				status: 'waiting',
				taskId
			}
		} as TestTaskRecord) as TestTaskRecord;
	}

	async getTaskDevice(recordId: string): Promise<Device> {
		const record = await MongoTests.findById(recordId) as TestTaskRecord;
		const taskId = record.data.taskId;
		const task = await MongoTests.findById(taskId) as TestTaskData;

		return task.data.device;
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
		const device = await this.getTaskDevice(recordId);

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

		const dealEnd = async (resove?: (v: unknown) => void) => {
			ssh.close();
			await this.dealTaskResult(recordId, taskRecord.data.taskId);
			if (resove) {
				resove(true);
			}
		};
		const loop = async (cmd: string) => {
			if (this.taskTempData[`record:${recordId}`].isStop) {
				return await dealEnd();
			}
			await this.publishLog(`[command]:${cmd}\n`, taskRecord._id.toString());

			await new Promise(resolve => {
				ssh.exec(cmd, async stream => {
					if (!stream) {
						const command = commands.shift();

						if (command) {
							resolve(await loop(command));
						} else {
							await dealEnd(resolve);
						}
					} else {
						stream.on('close', async () => {
							if (commands.length === 0 || this.taskTempData[`record:${recordId}`].isStop) {
								return await dealEnd(resolve)
							} else {
								const command = commands.shift();

								if (command) {
									resolve(await loop(command));
								} else {
									return await dealEnd(resolve);
								}
							}
						}).on('data', async (data: Buffer) => {
							if (this.taskTempData[`record:${recordId}`].isStop) {
								return await dealEnd(resolve);
							}
							await this.publishLog(data.toString(), taskRecord._id.toString());
						}).stderr.on('data', async (data) => {
							if (this.taskTempData[`record:${recordId}`].isStop) {
								return await dealEnd(resolve);
							}
							await this.publishLog(data.toString(), taskRecord._id.toString());
						});
					}
				});
			})
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


export const TaskScheduleService = new class SSHFrame {
	private getDeviceTaskQueue: Queue.Queue;
	private getDeviceConcurrencyLimit = 2;
	private getCommandsTaskQueue: Queue.Queue;
	private getCommandsConcurrencyLimit = 2;
	private remoteSSHTaskQueue: Queue.Queue;
	private remoteSSHTaskConcurrencyLimit = 2;

	constructor() {
		const redis = getENV('REDIS_URL');

		this.getDeviceTaskQueue = new Queue('get-device-task', { prefix: 'get-device', redis });
		this.getCommandsTaskQueue = new Queue('get-commands-task', { prefix: 'get-commands', redis });
		this.remoteSSHTaskQueue = new Queue('remote-ssh-task', { prefix: 'remote-ssh', redis });
		this.dealTaskQueue();
	}

	private async dealTaskQueue() {
		this.getDeviceTaskQueue.on('completed', (job, result: Device) => {
			console.log('获取设备成功');
			this.getCommandsTaskQueue.add({ record: job.data, device: result }, { jobId: job.data._id.toString() });
			job.remove();
		}).on('failed', (job) => {
			const data = job.data;

			job.remove();
			this.addTask(data);
		}).process(this.getDeviceConcurrencyLimit, async (job) => {
			return await this.getDevice(job.data._id.toString());
		})

		this.getCommandsTaskQueue.on('completed', (job, result: Array<string>) => {
			console.log('获取命令成功');
			this.remoteSSHTaskQueue.add({ record: job.data.record, commands: result, device: job.data.device }, { jobId: job.data.record._id.toString() });
			job.remove();
		}).on('failed', (job) => {
			const record = job.data.record;
			const device = job.data.device;

			job.remove();
			this.getCommandsTaskQueue.add({ record, device }, { jobId: record._id.toString() });
		}).process(this.getCommandsConcurrencyLimit, async job => {
			console.log('开始获取命令');
			return await this.getCommands(job.data.record._id.toString());
		})

		this.remoteSSHTaskQueue.on('completed', (job) => {
			console.log('任务执行成功');
			job.remove();
		}).on('failed', (job) => {
			const record = job.data.record;
			const device = job.data.device;
			const commands = job.data.commands;

			job.remove();
			this.remoteSSHTaskQueue.add({ record, commands, device }, { jobId: record._id.toString() });
		}).process(this.remoteSSHTaskConcurrencyLimit, async job => {
			console.log('开始执行任务');
			await this.executeCommands(job.data.commands, job.data.device, job.data.record._id.toString());
		});
	}

	async addTask(data: TestTaskRecord) {
		await this.getDeviceTaskQueue.add(data, { jobId: data._id.toString() });
	}

	private async getDevice(recordId: string): Promise<Device> {
		const record = await MongoTests.findById(recordId) as TestTaskRecord;
		const taskId = record.data.taskId;
		const task = await MongoTests.findById(taskId) as TestTaskData;

		return task.data.device;
	}

	private async getCommands(recordId: string) {
		const record = await MongoTests.findById(recordId) as TestTaskRecord;
		const taskId = record.data.taskId;
		const task = await MongoTests.findById(taskId) as TestTaskData;

		return task.data.commands;
	}

	private async executeCommands(_commands: Array<string>, device: Device, recordId: string) {
		if (!RemoteSSHTaskService.taskTempData[`record:${recordId}`]) {
			RemoteSSHTaskService.taskTempData[`record:${recordId}`] = {
				ranking: 0,
				isStop: false
			};
		}
		const commands = _commands;
		const ssh = new SSH();

		await ssh.connect(device);

		const record = await MongoTests.findOneAndUpdate({ _id: recordId }, {
			$set: {
				'data.status': 'running',
				'data.instance': process.env.INSTANCEID
			}
		}) as TestTaskRecord;
		await RemoteSSHTaskService.subTaskStopSignal(recordId);

		const dealEnd = async (resove?: (v: unknown) => void) => {
			ssh.close();
			await RemoteSSHTaskService.dealTaskResult(recordId, record.data.taskId);
			if (resove) {
				resove(true);
			}
		};
		const loop = async (cmd: string) => {
			if (RemoteSSHTaskService.taskTempData[`record:${recordId}`].isStop) {
				return await dealEnd();
			}
			await RemoteSSHTaskService.publishLog(`[command]:${cmd}\n`, recordId);

			await new Promise(resolve => {
				ssh.exec(cmd, async stream => {
					if (!stream) {
						const command = commands.shift();

						if (command) {
							resolve(await loop(command));
						} else {
							await dealEnd(resolve);
						}
					} else {
						stream.on('close', async () => {
							if (commands.length === 0 || RemoteSSHTaskService.taskTempData[`record:${recordId}`].isStop) {
								return await dealEnd(resolve)
							} else {
								const command = commands.shift();

								if (command) {
									resolve(await loop(command));
								} else {
									return await dealEnd(resolve);
								}
							}
						}).on('data', async (data: Buffer) => {
							if (RemoteSSHTaskService.taskTempData[`record:${recordId}`].isStop) {
								return await dealEnd(resolve);
							}
							await RemoteSSHTaskService.publishLog(data.toString(), recordId);
						}).stderr.on('data', async (data) => {
							if (RemoteSSHTaskService.taskTempData[`record:${recordId}`].isStop) {
								return await dealEnd(resolve);
							}
							await RemoteSSHTaskService.publishLog(data.toString(), recordId);
						});
					}
				});
			})
		};

		const command = commands.shift();

		if (command) {
			await loop(command);
		}
	}
}
