import '../../../../../startup/alias';
import '../../../../../startup/log';
import { log } from '@/configs';
const processExitCodeMap = {
	'normal': 0,
	'process-timeout': 1,
	'redis-error': 2,
	'unhandled-exception': 3,
	'unhandled-rejection': 4,
	'ssh-connect-error': 5,
	'ssh-timeout': 6,
	'task-stoped': 7,
	'task-error': 8
};
const exitForkProcess = (code: keyof typeof processExitCodeMap) => {
	setTimeout(() => {
		process.exit(processExitCodeMap[code]);
	}, 1000);
};

setTimeout(() => {
	exitForkProcess('process-timeout');
}, 1 * 60 * 60 * 1000);

process.env.CHILD_PROCESS = '1';
// @ts-ignore
process.setRedisReady = () => {
	log('task-redis').info(`redis connected success and ready to use for excute task process.`);
	if (process.send) {
		process.send({ error: null, signal: 'ready' });
	}
};
// @ts-ignore
process.setRedisError = (error) => {
	log('task-redis').error(`redis connected error and exit for excute task process.`);
	if (process.send) {
		process.send({ error, signal: null })
	}
	exitForkProcess('redis-error')
};
process.on('uncaughtException', reason => {
	log('SYSTEM').fatal(reason);
	exitForkProcess('unhandled-exception')
})
process.on('unhandledRejection', reason => {
	log('SYSTEM').fatal(reason);
	exitForkProcess('unhandled-rejection')
})

import { Client, ConnectConfig } from 'ssh2';
import redis from '@/tools/redis';

let num = 0;
let isStop = false;
const publishData = async (data: string, taskId: string) => {
	if (isStop) {
		return;
	}
	await redis.server?.rpush(`task:${taskId}`, data);
	if (data.includes('[stop]')) {
		isStop = true;
	} else {
		await redis.server?.publish(`task:${taskId}`, `[ranking]:${num}`)
		await redis.server?.publish(`task:${taskId}`, data)
		num++;
	}
}

const execTask = (deviceConfig: ConnectConfig, commands: Array<string>, taskId: string) => {
	const conn = new Client();

	conn.connect(deviceConfig).on('error', (error) => {
		if (process.send) {
			process.send({ error, signal: null });
		}
		exitForkProcess('ssh-connect-error')
	}).on('timeout', () => {
		const error = new Error('connect device timeout');

		if (process.send) {
			process.send({ error, signal: null });
		}
		exitForkProcess('ssh-timeout')
	}).on('end', async () => {
		await publishData(`[end]\n`, taskId);
		if (process.send) {
			process.send({ error: null, signal: 'end' });
		}
		exitForkProcess('normal')
	}).on('ready', async () => {
		log('task-process').info('远程设备连接成功，开始执行任务！');
		await redis.server?.ltrim(`task:${taskId}`, 1, 0)
		await publishData(`[start]\n`, taskId);

		if (process.send) {
			process.send({ error: null, signal: 'start' })
		}
		const loop = async (cmd: string) => {
			await publishData(`[command]:${cmd}\n`, taskId);
			conn.exec(cmd, (err, stream) => {
				if (err) throw err;

				stream.on('close', async () => {
					if (commands.length === 0) {
						conn.end();
					} else {
						const command = commands.shift();

						if (command) {
							await loop(command);
						}
					}
				}).on('data', async (data: Buffer) => {
					await publishData(data.toString(), taskId);
				}).stderr.on('data', async (data) => {
					await publishData(data.toString(), taskId);
				});
			});
		};
		const command = commands.shift();

		if (command) {
			await loop(command);
		}
	});
};

process.on('message', async ({ sjgnal, data }) => {
	log('task-process').debug(`child process for task get message from master process: \n${JSON.stringify({ sjgnal, data }, null, '   ')}`);
	if (sjgnal === 'exec_task') {
		const taskId = data.taskId;
		const subServer = redis.server?.duplicate();

		await subServer?.subscribe(`task:${taskId}`);
		subServer?.on('message', async (channel, message) => {
			if (channel !== `task:${taskId}`) {
				return;
			}
			if (message.includes('[stop]')) {
				await publishData('[stop]\n', taskId);
				log('task-process').debug('get task stop signal, child process for task exit!');

				if (process.send) {
					process.send({ error: null, signal: 'stoped' });
				}
				subServer.quit();
				log('task-process').warn('收到任务中断的指令，任务停止执行，子进程退出！');
				exitForkProcess('task-stoped')
			}
		})
		try {
			execTask(data.device, data.commands, taskId);
		} catch (error) {
			exitForkProcess('task-error')
		}
	}
});
