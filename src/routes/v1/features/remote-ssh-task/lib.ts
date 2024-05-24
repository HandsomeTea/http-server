import fs from 'fs';
import path from 'path';
import { MongoTests } from '@/models/mongo';
import { SSH } from '@/services';
import redis from '@/tools/redis';
import { log } from '@/configs';


export const generateTaskRecord = async (taskId: string) => {
	const latestRunningRecord = await MongoTests.findOne({
		type: 'remote-ssh-task-record',
		'data.status': { $nin: ['stoped', 'finished'] },
		'data.taskId': taskId
	});

	if (latestRunningRecord) {
		return latestRunningRecord;
	}
	return await MongoTests.insertOne({
		type: 'remote-ssh-task-record',
		data: {
			status: 'waiting',
			taskId
		}
	} as TestModel);
};

const getTaskDevice = async (): Promise<{ host: string, port: number, username: string, password: string }> => {
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
};

let publishRanking = 0;
let isStop = false;

const publishLog = async (log: string, recordId: string) => {
	if (isStop) {
		return;
	}

	await redis.server?.rpush(`task:record:${recordId}`, log);
	await redis.server?.publish(`task:record:${recordId}`, `[ranking]:${publishRanking}`)
	await redis.server?.publish(`task:record:${recordId}`, log)
	publishRanking++;

	if (log.includes('[stop]')) {
		isStop = true;
	}
};

const subTaskRecord = async (recordId: string) => {
	const subServer = redis.server?.duplicate();

	await subServer?.subscribe(`task:record:${recordId}`);
	subServer?.on('message', async (channel, message) => {
		if (channel !== `task:record:${recordId}`) {
			return;
		}
		if (message.includes('[stop]')) {
			await publishLog('[stop]\n', recordId);
			subServer.quit();
		}
	});
}

export const excuteRecord = async (recordId: string) => {
	const device = await getTaskDevice();

	if (!device) {
		return;
	}
	const taskRecord = await MongoTests.findOneAndUpdate({ _id: recordId }, {
		$set: {
			'data.status': 'handling'
		}
	}) as TestTaskResult;
	const commands = (await MongoTests.findOne({
		type: 'remote-ssh-task-data',
		_id: taskRecord.data.taskId
	}) as TestTaskData).data.commands;
	const ssh = new SSH();

	await ssh.connect(device);

	await MongoTests.findOneAndUpdate({ _id: recordId }, {
		$set: {
			'data.status': 'running'
		}
	})
	await subTaskRecord(recordId);
	const loop = async (cmd: string) => {
		if (isStop) {
			return ssh.close();
		}
		await publishLog(`[command]:${cmd}\n`, taskRecord._id.toString());
		const stream = await ssh.exec(cmd);

		if (!stream) {
			const command = commands.shift();

			if (command) {
				await loop(command);
			}
		} else {
			stream.on('close', async () => {
				if (isStop) {
					return ssh.close();
				}
				if (commands.length === 0) {
					ssh.close();
				} else {
					const command = commands.shift();

					if (command) {
						await loop(command);
					}
				}
			}).on('data', async (data: Buffer) => {
				if (isStop) {
					return ssh.close();
				}
				await publishLog(data.toString(), taskRecord._id.toString());
			}).stderr.on('data', async (data) => {
				if (isStop) {
					return ssh.close();
				}
				await publishLog(data.toString(), taskRecord._id.toString());
			});
		}
	};

	// ================================= 开始执行命令 ================================
	const command = commands.shift();

	if (command) {
		await loop(command);
	}
	// ================================= 处理执行结果 ================================
	const logFileDirPath = path.resolve(__dirname, `../../../../../task-data/${taskRecord.data.taskId}`);

	fs.mkdirSync(logFileDirPath, { recursive: true });
	const logFilePath = path.resolve(logFileDirPath, `${new Date().getTime()}.log`);

	const count = await redis.server?.llen(`task:record:${recordId}`);

	if (count) {
		const writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });

		writeStream.once('open', async () => {
			for (let i = 0; i < count; i++) {
				const data = await redis.server?.lindex(`task:record:${recordId}`, i);

				writeStream.write(data as string);
			}

			writeStream.end();
		})

		writeStream.on('close', async () => {
			// 结果上传oss
			// const ossAddress = await oss.uploadFile(logFilePath, `${taskRecord.data.taskId}/${path.basename(logFilePath)}`);
			await MongoTests.updateOne({
				'data.taskId': taskRecord.data.taskId,
				'data.status': 'running',
				type: 'remote-ssh-task-record'
			}, {
				$set: {
					'data.status': isStop ? 'stoped' : 'finished',
					'data.result': logFilePath
				}
			});
			await redis.server?.ltrim(`task:record:${recordId}`, 1, 0)
			log('master-process').info(`任务执行结束，结束状态为: ${isStop ? '被中断' : '成功'}`);
		})
	}
};

export const addTask = (recordId: string) => {

};
