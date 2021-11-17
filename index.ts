global.IntervalUpdateInstance = 10;
global.IntervalCleanUnusedInstance = 30;
import './startup';

import { audit, getENV, log } from '@/configs';

process.on('unhandledRejection', reason => {
    // 处理没有catch的promise，第二个参数即为promise
    log('SYSTEM').fatal(reason);
    audit('SYSTEM').fatal(reason);
});

const port = ((val: string): number => {
    const port = parseInt(val, 10);

    if (port >= 0) {
        return port;
    }

    throw new Error('invalid port!');
})('3000');

import http from 'http';
import app from '@/routes/app';

app.set('port', port);
const server = http.createServer(app);

/**============================================socket 封装 ================================ start */
global.IntervalCleanEmptySession = 30;
global.IntervalCleanUnusedSession = 30;
global.WebsocketUserIdMap = {};

import { WebSocketServer } from './websocket';
global.WebsocketServer = new WebSocketServer({ server });

/** 封装socket */
import socketCore from '@/socket/core';
import socketMethods from '@/socket/methods';
import crypto from 'crypto';

global.WebsocketServer.connection((socket, request) => {
    socket.attempt = {
        connection: {
            id: crypto.randomBytes(24).toString('hex').substring(0, 16),
            ip: request.connection.remoteAddress || ''
        }
    };
    socket.middlewareMap = new Set();
    socketCore(socket);
    socketMethods(socket);
});
/**============================================socket 封装 ================================ end */


import redis from '@/tools/redis';
import mongodb from '@/tools/mongodb';
import mysql from '@/tools/mysql';

/**
 * 当服务将要停止时的钩子函数
 * 比如向其他服务通知当前服务已经停止
 */
const willShutDown = async () => {
    // do something when shutdown, when process is killed, this function is unused.
};

/**
 * 服务是否正常的健康检查
 */
const isHealth = async () => {
    let result = true;

    if (!mongodb.isUseful) {
        result = false;
        log('SYSREM_STARTUP').error('mongodb connection is unusual');
    }
    if (!redis.isUseful) {
        result = false;
        log('SYSREM_STARTUP').error('redis connection is unusual');
    }
    if (!mysql.isUseful) {
        result = false;
        log('SYSREM_STARTUP').error('mysql connection is unusual');
    }
    if (result) {
        log('SYSREM_STARTUP').debug('system is normal.');
    }
    return result;
};

/** 健康检查机制 */
import { createTerminus } from '@godaddy/terminus';

createTerminus(server, {
    signal: 'SIGINT',
    healthChecks: {
        '/healthcheck': async () => {
            if (!await isHealth()) {
                throw new Error();
            }
            // do something to improve server is normal
            // if normal, no need to do anything like return, we will send a 200 code with  { status: "ok" }
            // if not normal, you can throw a Error, we will send a 503 code with  { status: "error" }
        }
    },
    onSignal: willShutDown
});

process.on('SIGINT', () => {
    process.exit(0);
});

process.on('exit', async () => {
    await mongodb.close();
    await redis.close();
    await mysql.close();
    log('SYSREM_STOP_CLEAN').info('server connection will stop normally.');
});

/** Event listener for HTTP server "error" event. */
const onError = (error: { syscall: string, code: string }) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    switch (error.code) {
        case 'EACCES':
            log('SYSREM_STARTUP').error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log('SYSREM_STARTUP').error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const onListening = () => {
    const addr = server.address();

    if (addr) {
        const bind = typeof addr === 'string'
            ? `pipe ${addr}`
            : `port ${addr.port}`;

        log('SYSREM_STARTUP').info(`${getENV('SERVER_NAME')} listening on ${bind}.`);
    }
};

server.on('error', onError);
server.on('listening', onListening);

/** 服务开始监听请求 */
server.listen(port, '0.0.0.0', () => {
    const _check = setInterval(async () => {
        if (!await isHealth()) {
            return;
        }
        global.isServerRunning = true;
        if (process.send) {
            process.send('ready');
        }
        clearInterval(_check);
        log('SYSREM_STARTUP').info(`api document running on http://127.0.0.1:${port}.`);
    }, 1000);
});
