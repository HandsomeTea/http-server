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
                    // console.log('命令执行结果: ' + data);
                    await publishData(data.toString(), taskId);
                }).stderr.on('data', async (data) => {
                    // console.log('命令执行中输出: ' + data);
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
    console.log('child get message: ', { sjgnal, data });
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
                console.log('收到任务终止命令，退出子进程');

                if (process.send) {
                    process.send({ error: null, signal: 'stoped' });
                }
                subServer.quit();
                exitForkProcess(2)
            }
        })
        execTask(data.device, data.commands, taskId);
    }
});
