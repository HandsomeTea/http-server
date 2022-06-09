import './startup';

import { audit, getENV, log } from '@/configs';

process.on('unhandledRejection', (reason, promise) => {
    log('SYSTEM').fatal(reason);
    audit('SYSTEM').fatal(reason);

    if (promise) {
        promise.catch(error => {
            log('SYSTEM').error(error);
            audit('SYSTEM').error(error);
        }).then(data => {
            log('SYSTEM').info(data);
            audit('SYSTEM').info(data);
        });
    }
});

process.on('uncaughtException', (reason) => {
    log('SYSTEM').fatal(reason);
});

const port = ((val: string): number => {
    const port = parseInt(val, 10);

    if (port >= 0) {
        return port;
    }

    throw new Error('invalid port!');
})(getENV('PORT') || '3000');

import http from 'http';
import app from '@/routes/app';

app.set('port', port);
const server = http.createServer(app);

import mongodb from '@/tools/mongodb';
import sql from '@/tools/sql';
import dm from '@/tools/dameng';
import redis from '@/tools/redis';
import mq from '@/tools/mq';

/**
 * 健康检查
 */
const isHealth = async () => {
    let result = true;

    if (!mongodb.isOK) {
        result = false;
        log('STARTUP').error('mongodb connection is unusual');
    }
    if (!sql.isOK) {
        result = false;
        log('STARTUP').error('sql connection is unusual');
    }
    if (!dm.isOK) {
        result = false;
        log('STARTUP').error('dmdb connection is unusual');
    }
    if (!redis.isOK) {
        result = false;
        log('STARTUP').error('redis connection is unusual');
    }
    if (!mq.isOK) {
        result = false;
        log('STARTUP').error('mq connection is unusual');
    }
    if (result) {
        log('STARTUP').debug('system is normal.');
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
    }
});

process.on('SIGINT', () => {
    process.exit(0);
});

process.on('exit', async () => {
    await mongodb.close();
    await sql.close();
    await dm.close();
    await redis.close();
    await mq.close();
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
            log('STARTUP').error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log('STARTUP').error(`${bind} is already in use`);
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

        log('STARTUP').info(`${getENV('SERVER_NAME')} listening on ${bind}.`);
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
        log('STARTUP').info(`api document running on http://127.0.0.1:${port}.`);
    }, 1000);
});
