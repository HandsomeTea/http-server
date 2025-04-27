import fs from 'fs';
import readline from 'readline';
import path from 'path';
import childProcess from 'child_process';
import Redis from 'ioredis';
import express from 'express';
import asyncHandler from 'express-async-handler';
import httpContext from 'express-http-context';
import redis from '@/tools/redis';
import { MongoTests } from '@/models/mongo';
import { log, trace } from '@/configs';
// import { MinioOSS } from '@/services';

const router = express.Router();

// router.get('/remote-ssh-task/tasks', asyncHandler(async (_req, res) => {
// 	// const aa = await MinioOSS.uploadFile({
// 	// 	readStream: fs.createReadStream('/usr/src/app/build/task-data/663c42d935eb9177c7b484e1/1715225607016.log'),
// 	// }, {
// 	// 	bucket: 'test',
// 	// 	targetPath: '/ssh-task/log',
// 	// 	fileName: 'log2.log'
// 	// })

// 	// res.success(aa)
// 	// res.success(await MinioOSS.deleteFile('test', '/ssh-task/log/log.log'));
// 	// await MinioOSS.downloadFile('test', '/ssh-task/log/log.log', { toFile: '/usr/src/app/public/log2.log' })
// 	// res.success(await MinioOSS.getFile('test', '/ssh-task/log/log.log'));
// 	// res.success(await MinioOSS.getFile('test', '/ssh-task/log/log2.log'));
// 	// res.success(await MinioOSS.searchFilesFromBucket('test', { recursive: true, prefix: 'ssh-task/log/log' }));
// 	// res.success();
// 	res.success(await MinioOSS.searchBuckets('test'));
// }));

/**
 * @api {get} /api/v1/feature/remote-ssh-task/task 查询远程执行ssh命令的任务
 * @apiName get-remote-ssh-task
 * @apiGroup SSH
 * @apiVersion 1.0.0
 * @apiUse ErrorApiResult
 */
router.get('/remote-ssh-task/task', asyncHandler(async (_req, res) => {
	const task = {
		type: 'remote-ssh-task-data',
		data: {
			name: '在远程机器执行命令',
			device: {
				host: 'xx.xx.xx.xx',
				port: 22,
				username: 'liuhaifeng',
				password: ''
			},
			// commands: [
			// 	'find /home/SENSETIME/liuhaifeng -name "ssh-test"',
			// 	'cd /home/SENSETIME/liuhaifeng',
			// 	'cd /home/SENSETIME/liuhaifeng',
			// 	'curl -LO https://download.java.net/openjdk/jdk8u40/ri/jdk_ri-8u40-b25-linux-x64-10_feb_2015.tar.gz'
			// ]
			commands: new Array(60).fill('0').map((_item, index) => {
				return [
					'sleep 1s',
					`echo number:${index}`
				]
			}).flat()
		}
	} as TestTaskData;

	const data = await MongoTests.findOne({ type: 'remote-ssh-task-data' });

	if (data) {
		res.success(data);
	} else {
		res.success(await MongoTests.insertOne(task));
	}
}));

import { RemoteSSHTaskService, TaskScheduleService } from './service';

/**
 * @api {post} /api/v1/feature/remote-ssh-task/task/:taskId/exec 执行任务
 * @apiName exec-remote-ssh-task
 * @apiGroup SSH
 * @apiVersion 1.0.0
 * @apiParam {String} taskId 任务id
 * @apiUse ErrorApiResult
 */
router.post('/remote-ssh-task/task/:taskId/exec', asyncHandler(async (req, res) => {
	const taskId = req.params.taskId;
	const taskRecord = await RemoteSSHTaskService.generateTaskRecord(taskId);

	await TaskScheduleService.addTask(taskRecord);
	res.success(taskRecord._id);
}));

/**
 * @api {post} /api/v1/feature/remote-ssh-task/task/:taskId/exec/process 执行任务(子进程)
 * @apiName exec-remote-ssh-task-with-process
 * @apiGroup SSH
 * @apiVersion 1.0.0
 * @apiParam {String} taskId 任务id
 * @apiUse ErrorApiResult
 */
router.post('/remote-ssh-task/task/:taskId/exec/process', asyncHandler(async (req, res) => {
	const taskId = req.params.taskId;
	const latestRunningRecord = await MongoTests.findOne({
		type: 'remote-ssh-task-record',
		'data.status': 'running',
		'data.taskId': taskId
	});

	if (latestRunningRecord) {
		res.success(latestRunningRecord._id);
		return;
	}

	let child: childProcess.ChildProcess | null = childProcess.fork(path.join(__dirname, 'task-process.js'))

	child.on('exit', () => {
		child = null;
	});
	const task = await MongoTests.findById(taskId) as TestTaskData;
	const taskRecord = await MongoTests.insertOne({
		type: 'remote-ssh-task-record',
		data: {
			status: 'waiting',
			taskId
		}
	} as TestModel);

	child.on('message', async (data: { error?: Error, signal?: 'ready' | 'start' | 'end' | 'stoped' }) => {
		const { error, signal } = data;
		log('master-process').debug(`master process get message from child process for task: \n${JSON.stringify(data, null, '   ')}`);
		if (error) {
			throw new Exception(error);
		}
		if (signal === 'ready') {
			child?.send({
				signal: 'exec_task',
				data: {
					recordId: taskRecord._id.toString(),
					device: task.data.device,
					commands: task.data.commands
				}
			});
		} else if (signal === 'start') {
			await MongoTests.updateOne({ _id: taskRecord._id }, {
				$set: {
					'data.status': 'running'
				}
			});
			res.success(taskRecord._id);
		} else if (signal === 'end' || signal === 'stoped') {
			const logFileDirPath = path.resolve(__dirname, `../../../../../task-data/${taskId}`);

			fs.mkdirSync(logFileDirPath, { recursive: true });
			const logFilePath = path.resolve(logFileDirPath, `${new Date().getTime()}.log`);
			// ================================= 逐条读取和写入 =================================
			const count = await redis.server?.llen(`task:record:${taskRecord._id}`);

			if (count) {
				const writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });

				writeStream.once('open', async () => {
					for (let i = 0; i < count; i++) {
						const data = await redis.server?.lindex(`task:record:${taskRecord._id}`, i);

						writeStream.write(data as string);
					}

					writeStream.end();
				})

				writeStream.on('close', async () => {
					await MongoTests.updateOne({
						'data.taskId': taskId,
						'data.status': 'running',
						type: 'remote-ssh-task-record'
					}, {
						$set: {
							'data.status': signal === 'end' ? 'finished' : 'stoped',
							'data.result': logFilePath
						}
					});
					await redis.server?.ltrim(`task:record:${taskRecord._id}`, 1, 0)
					log('master-process').info(`任务执行结束，结束状态为: ${signal === 'end' ? '成功' : '被中断'}`);
				})
			}

			// ================================= 整体读取和写入 =================================
			// const result = await redis.server?.lrange(`task:record:${taskRecord._id}`, 0, -1);

			// if (result && result.length > 0) {
			// 	fs.writeFileSync(logFilePath, result.join(''));
			// }
			// await MongoTests.updateOne({
			// 	'data.taskId': taskId,
			// 	'data.status': 'running',
			// 	type: 'remote-ssh-task-record'
			// }, {
			// 	$set: {
			// 		'data.status': signal === 'end' ? 'finished' : 'stoped',
			// 		'data.result': logFilePath
			// 	}
			// });
			// await redis.server?.ltrim(`task:record:${taskRecord._id}`, 1, 0)
			// log('master-process').info(`任务执行结束，结束状态为: ${signal === 'end' ? '成功' : '被中断'}`);
		}
	});
}));

/**
 * @api {put} /api/v1/feature/remote-ssh-task/record/:recordId/stop 中断任务
 * @apiName stop-remote-ssh-task
 * @apiGroup SSH
 * @apiVersion 1.0.0
 * @apiParam {String} recordId 中断任务的执行记录id
 * @apiUse ErrorApiResult
 */
router.put('/remote-ssh-task/record/:recordId/stop', asyncHandler(async (req, res) => {
	const recordId = req.params.recordId;
	const taskRecord = await MongoTests.findById(recordId) as TestTaskRecord;

	if (!taskRecord) {
		throw new Exception('task record not found!');
	}
	if (taskRecord.data.status !== 'running') {
		throw new Exception('task is not running!');
	}
	const taskChannel = `task:record:${recordId}:sub`;

	await redis.server?.publish(taskChannel, '[stop]');
	res.success();
}));

/**
 * @api {get} /api/v1/feature/remote-ssh-task/record/:recordId/log 获取任务执行日志
 * @apiName get-remote-ssh-task-log
 * @apiGroup SSH
 * @apiVersion 1.0.0
 * @apiParam {String} recordId 中断任务的执行记录id
 * @apiUse ErrorApiResult
 */
router.get('/remote-ssh-task/record/:recordId/log', asyncHandler(async (req, res) => {
	const recordId = req.params.recordId;
	const taskRecord = await MongoTests.findById(recordId) as TestTaskRecord | null;

	if (!taskRecord) {
		throw new Exception('task record not found!');
	}
	res.set({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform',
		'Connection': 'keep-alive',
		'X-Accel-Buffering': 'no'
	});
	res.flushHeaders();

	let subServer: null | undefined | Redis = redis.server?.duplicate();

	req.on('close', () => {
		subServer?.quit();
		subServer = null;
		trace({
			traceId: httpContext.get('traceId'),
			spanId: httpContext.get('spanId'),
			parentSpanId: httpContext.get('parentSpanId')
		}, 'sse-response').info(`${req.method}: ${req.originalUrl} => \n${'SSE响应结束！'}`);
		return;
	})
	const taskChannel = `task:record:${taskRecord._id}:sub`;

	if (taskRecord.data.status === 'finished' || taskRecord.data.status === 'stoped') {
		const readStream = fs.createReadStream(taskRecord.data.result, {
			encoding: 'utf-8',
			highWaterMark: 1,
			autoClose: true
		});

		const readLineStream = readline.createInterface({
			input: readStream,
			// input: await MinioOSS.downloadFile('test', '/ssh-task/log/log.log', { toStream: true }),
			output: process.stdout,
			terminal: false
		});

		readLineStream.on('line', (chunk) => {
			trace({
				traceId: httpContext.get('traceId'),
				spanId: httpContext.get('spanId'),
				parentSpanId: httpContext.get('parentSpanId')
			}, 'sse-response').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(chunk, null, '   ')}`);
			res.write(`data: ${chunk}\n\n`);
		}).on('close', () => {
			res.end();
		}).on('error', (error: Error) => {
			throw new Exception(error);
		});
		return;
	}

	let isGetHistroy = false;
	let histroyEndNum = 0;
	let waitData: Array<string> = [];

	await subServer?.subscribe(taskChannel);
	subServer?.on('message', async (channel, message) => {
		if (channel !== taskChannel) {
			return;
		}
		if (message.includes('[stop]')) {
			log('sse-ssh-task').debug('收到任务终止命令，关闭客户端连接，停止数据推送');
			trace({
				traceId: httpContext.get('traceId'),
				spanId: httpContext.get('spanId'),
				parentSpanId: httpContext.get('parentSpanId')
			}, 'sse-response-realtime').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(message, null, '   ')}`);
			res.write(`data: ${message}\n\n`);
			res.end();
			return;
		}
		if (!isGetHistroy) {
			if (!histroyEndNum) {
				if (message.includes('[ranking]:')) {
					histroyEndNum = parseInt(message.replace('[ranking]:', ''));
					const redisKey = `task:record:${taskRecord._id}`;

					for (let s = 0; s < histroyEndNum; s++) {
						const log = await redis.server?.lindex(redisKey, s);

						trace({
							traceId: httpContext.get('traceId'),
							spanId: httpContext.get('spanId'),
							parentSpanId: httpContext.get('parentSpanId')
						}, 'sse-response-histroy').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(log, null, '   ')}`);

						res.write(`data: ${log}\n\n`);
					}
					// const logs = await redis.server?.lrange(taskChannel, 0, histroyEndNum - 1);

					// if (logs && logs.length > 0) {
					// 	trace({
					// 		traceId: httpContext.get('traceId'),
					// 		spanId: httpContext.get('spanId'),
					// 		parentSpanId: httpContext.get('parentSpanId')
					// 	}, 'sse-response-histroy').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(logs, null, '   ')}`);

					// 	for (let s = 0; s < logs.length; s++) {
					// 		res.write(`data: ${logs[s]}\n\n`);
					// 	}
					// }
					isGetHistroy = true;
				}
			} else if (!message.includes('[ranking]:')) {
				waitData.push(message);
			}
		} else {
			if (waitData.length > 0) {
				trace({
					traceId: httpContext.get('traceId'),
					spanId: httpContext.get('spanId'),
					parentSpanId: httpContext.get('parentSpanId')
				}, 'sse-response-temp').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(waitData, null, '   ')}`);
				for (let s = 0; s < waitData.length; s++) {
					res.write(`data: ${waitData[s]}\n\n`);
				}
				waitData = [];
			}
			if (!message.includes('[ranking]:')) {
				trace({
					traceId: httpContext.get('traceId'),
					spanId: httpContext.get('spanId'),
					parentSpanId: httpContext.get('parentSpanId')
				}, 'sse-response-realtime').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(message, null, '   ')}`);
				res.write(`data: ${message}\n\n`);
				if (message.includes('[end]')) {
					res.end();
				}
			}
		}
	});
}));

export default router;
