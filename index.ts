debugger; /* eslint-disable-line*/
import crypto from 'crypto';

process.env.INSTANCEID = crypto.randomBytes(24).toString('hex').substring(0, 17);
global.IntervalUpdateInstance = 10; //instance保活间隔,单位为秒
global.IntervalCheckEmptySession = 30; //清空空的session数据间隔,单位为秒
global.IntervalCleanSessionOfInstance = 30; //清空已经不存在的instance下的所有session,单位为秒
import './startup';

import { audit, log } from './src/configs';

process.on('unhandledRejection', reason => {
    // 处理没有catch的promiss，第二个参数即为promiss
    log('SYSTEM').fatal(reason);
    audit('SYSTEM').fatal(reason);
});

const _getPort = (val: string): number => {
    const port = parseInt(val, 10);

    if (port >= 0) {
        return port;
    }

    throw new Error('invalid port!');
};
const port = _getPort('3000');

import http from 'http';
import app from './src/routes/app';

/**Get port from environment and store in Express. */
app.set('port', port);
const server = http.createServer(app);

global.WebsocketUserIdMap = {};

import { WebSocketServer } from './websocket';
global.WebsocketServer = new WebSocketServer({ server });

/** 封装socket */
import socketCore from './src/socket/core';
import socketMethods from './src/socket/methods';

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

import redis from './src/db/redis';
import mongodb from './src/db/mongodb';

/**
 * 当服务将要停止时的钩子函数
 * 比如向其他服务通知当前服务已经停止
 */
const willShutDown = async () => {
    //
};

/**
 * 健康检查的钩子函数
 */
const healthCheck = async () => {
    const result = mongodb.status === true && redis.status === true;

    if (!result) {
        log('SYSREM_STARTUP').fatal('system is shut down.');
    }
    log('SYSREM_STARTUP').debug('system is normal.');
};

/** 健康检查机制 */
import { createTerminus } from '@godaddy/terminus';

createTerminus(server, {
    signal: 'SIGINT',
    healthChecks: {
        '/healthcheck': healthCheck
    },
    onSignal: willShutDown
});

process.on('SIGINT', () => {
    process.exit(0);
});

process.on('exit', async () => {
    await mongodb.close();
    await redis.close();
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

/** Event listener for HTTP server "listening" event. */
const onListening = () => {
    const addr = server.address();

    if (addr) {
        const bind = typeof addr === 'string'
            ? `pipe ${addr}`
            : `port ${addr.port}`;

        log('SYSREM_STARTUP').info(`${process.env.SERVER_NAME} listening on ${bind}.`);
    }

    debugger; /* eslint-disable-line*/
};

server.on('error', onError);
server.on('listening', onListening);

/** 服务开始监听请求 */
server.listen(port, '0.0.0.0', async () => {
    const _check = setInterval(() => {
        const result = mongodb.status === true && redis.status === true;

        if (result) {
            global.isServerRunning = true;
            if (process.send) {
                process.send('ready');
            }
            clearInterval(_check);
            log('SYSREM_STARTUP').info(`api document running on http://127.0.0.1:${port} .`);
        } else {
            log('SYSREM_STARTUP').error('mongodb or redis connection is unusual');
        }
    }, 1000);
});
