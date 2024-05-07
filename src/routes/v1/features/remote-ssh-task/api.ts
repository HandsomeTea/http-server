import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';
import Redis from 'ioredis';
import express from 'express';
import asyncHandler from 'express-async-handler';
// import httpContext from 'express-http-context';
import redis from '@/tools/redis';
// import { trace } from '@/configs';

const router = express.Router();

// /api/v1/feature/remote-ssh-task/:taskId/exec
router.post('/remote-ssh-task/:taskId/exec', asyncHandler(async (req, res) => {
    const taskId = req.params.taskId;
    const taskChannel = `task:${taskId}`;

    if (await redis.server?.exists(taskChannel)) {
        return res.success({ message: `${taskId} pending!` });
    }
    let child: childProcess.ChildProcess | null = childProcess.fork(path.join(__dirname, 'task.js'))
    let timer: NodeJS.Timeout | null = setTimeout(() => {
        try {
            child?.kill();
            child = null;
        } catch (e) { }
        res.success({ message: `${taskId} timeout!` });
        clearTimeout(timer as NodeJS.Timeout);
        timer = null;
    }, 10 * 1000);

    child.on('exit', () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        child = null;
    });
    child.on('message', async (data: { error?: Error, signal?: 'ready' | 'start' | 'end' | 'stoped' }) => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        const { error, signal } = data;
        console.log('parent get message: ', data);
        if (error) {
            return res.success({ message: `${taskId} error!` });
        }
        if (signal === 'ready') {
            child?.send({
                sjgnal: 'exec_task',
                data: {
                    taskId,
                    device: {},
                    // commands: [
                    //     'find /home/SENSETIME/liuhaifeng -name "ssh-test"',
                    //     'cd /home/SENSETIME/liuhaifeng',
                    //     'curl -LO https://download.java.net/openjdk/jdk8u40/ri/jdk_ri-8u40-b25-linux-x64-10_feb_2015.tar.gz'
                    // ]
                    commands: new Array(60).fill('0').map((_item, index) => {
                        return [
                            'sleep 1s',
                            `echo number:${index}`
                        ]
                    }).flat()
                }
            });
        } else if (signal === 'start') {
            res.success({ message: `${taskId} success!` });
        } else if (signal === 'end' || signal === 'stoped') {
            const logFileDirPath = path.resolve(__dirname, `../../../../../task-data/${taskId}`);

            fs.mkdirSync(logFileDirPath, { recursive: true });
            const result = await redis.server?.lrange(`task:${taskId}`, 0, -1);

            if (result && result.length > 0) {
                fs.writeFileSync(path.resolve(logFileDirPath, `${new Date().getTime()}.log`), result.join(''));
            }
            await redis.server?.ltrim(`task:${taskId}`, 1, 0)
            console.log('日志文件写入成功');
        }
    });
}));

// /api/v1/feature/remote-ssh-task/:taskId/stop
router.put('/remote-ssh-task/:taskId/stop', asyncHandler(async (req, res) => {
    const taskId = req.params.taskId;
    const taskChannel = `task:${taskId}`;

    if (!await redis.server?.exists(taskChannel)) {
        res.success({ message: `task ${taskId} not execte!` });
        return;
    }
    await redis.server?.publish(taskChannel, '[stop]');
    res.success({ message: `task ${taskId} stop success!` });
}));

// /api/v1/feature/remote-ssh-task/:taskId/log
router.get('/remote-ssh-task/:taskId/log', asyncHandler(async (req, res) => {
    const taskId = req.params.taskId;

    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();

    let subServer: null | undefined | Redis = redis.server?.duplicate();

    req.on('close', () => {
        console.log('客户端断开，停止推送');
        res.end();
        subServer?.quit();
        subServer = null;
        return;
    })
    const taskChannel = `task:${taskId}`;

    if (!await redis.server?.exists(taskChannel)) {
        res.write(`data: ${'[finish]'}\n\n`);
        res.end();
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
            console.log('收到任务终止命令，关闭客户端连接，停止数据推送');
            console.log('data: ', message);
            res.write(`data: ${message}\n\n`);
            res.end();
            return;
        }
        if (!isGetHistroy) {
            if (!histroyEndNum) {
                if (message.includes('[ranking]:')) {
                    histroyEndNum = parseInt(message.replace('[ranking]:', ''));

                    await redis.server?.lrange(taskChannel, 0, histroyEndNum - 1).then((resss) => {
                        if (resss.length > 0) {
                            for (let s = 0; s < resss.length; s++) {
                                console.log('histroyData: ', resss[s]);
                                res.write(`data: ${resss[s]}\n\n`);
                            }
                        }
                        isGetHistroy = true;
                    });
                }
            } else if (!message.includes('[ranking]:')) {
                waitData.push(message);
            }
        } else {
            if (waitData.length > 0) {
                for (let s = 0; s < waitData.length; s++) {
                    console.log('waitData: ', waitData[s]);
                    res.write(`data: ${waitData[s]}\n\n`);
                }
                waitData = [];
            }
            if (!message.includes('[ranking]:')) {
                console.log('data: ', message);
                res.write(`data: ${message}\n\n`);
                if (message.includes('[end]')) {
                    res.end();
                }
            }
        }
    });
}));

export default router;
