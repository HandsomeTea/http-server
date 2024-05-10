import '../../../../../startup/alias';
import '../../../../../startup/log';
import { log } from '@/configs';

const exitForkProcess = (code: number) => {
	setTimeout(() => {
		process.exit(code);
	}, 1000)
};

process.env.CHILD_PROCESS = '1';
// @ts-ignore
process.setReady = () => {
	log('task-redis').info(`redis connected success and ready to use for excute task process.`);
	if (process.send) {
		process.send({ error: null, signal: 'ready' });
	}
};
// @ts-ignore
process.setError = (error) => {
	log('task-redis').error(`redis connected error and exit for excute task process.`);
	if (process.send) {
		process.send({ error, signal: null })
	}
	exitForkProcess(1)
};
process.on('uncaughtException', reason => {
	log('SYSTEM').fatal(reason);
	exitForkProcess(5)
})
process.on('unhandledRejection', reason => {
	log('SYSTEM').fatal(reason);
	exitForkProcess(6)
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
		exitForkProcess(4)
	}).on('timeout', () => {
		const error = new Error('connect device timeout');

		if (process.send) {
			process.send({ error, signal: null });
		}
		exitForkProcess(3)
	}).on('end', async () => {
		await publishData(`[end]\n`, taskId);
		if (process.send) {
			process.send({ error: null, signal: 'end' });
		}
		exitForkProcess(0)
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
				exitForkProcess(2)
			}
		})
		execTask(data.device, data.commands, taskId);
	}
});
