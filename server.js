debugger; /* eslint-disable-line*/
require('./startup');

const { audit, log } = require('./src/configs');

process.on('unhandledRejection', reason => {
    // 处理没有catch的promiss，第二个参数即为promiss
    log('SYSTEM').fatal(reason);
    audit('SYSTEM').fatal(reason);
});

/**
 * 处理端口
 * @param {*} val
 */
const _getPort = val => {
    const port = parseInt(val, 10);

    // named pipe
    if (isNaN(port)) {
        return val;
    }

    // port number
    if (port >= 0) {
        return port;
    }

    return false;
};

const port = _getPort(3000);
const app = require('./src/app');

/**Get port from environment and store in Express. */
app.set('port', port);


const http = require('http');
const crypto = require('crypto');
const WebSocket = require('ws');
const server = http.createServer(app);

global.WebsocketServerMap = {};
global.WebsocketServer = new WebSocket.Server({ server });
/** 封装socket */
WebsocketServer.on('connection', (socket, request) => {
    global.socketConnectionNum++;
    socket.attempt = {
        connection: {
            id: crypto.randomBytes(24).toString('hex').substring(0, 16),
            ip: request.connection.remoteAddress
        }
    };
    socket.middlewareMap = new Set();
    require('./src/socket/core')(socket);
    require('./src/socket/methods')(socket);
});

/** Event listener for HTTP server "error" event. */
const onError = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

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
    let addr = server.address();

    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

    log('SYSREM_STARTUP').info(`${process.env.SERVER_NAME} listening on ${bind}.`);
    debugger; /* eslint-disable-line*/
};


const redis = require('./src/db/redis');
const mongodb = require('./src/db/mongo');

/**
 * 当服务将要停止时的钩子函数
 * 比如向其他服务通知当前服务已经停止
 */
const _willShutDown = async () => { };

/**
 * 健康检查的钩子函数
 */
const _healthCheck = async () => {
    const result = mongodb.status === true && redis.status === true;

    if (!result) {
        log('SYSREM_STARTUP').fatal('system is shut down.');
    }
    log('SYSREM_STARTUP').debug('system is normal.');
};

/** 健康检查机制 */
const { createTerminus } = require('@godaddy/terminus');

createTerminus(server, {
    signal: 'SIGINT',
    healthChecks: {
        '/healthcheck': _healthCheck
    },
    onSignal: _willShutDown
});

process.on('SIGINT', () => {
    process.exit(0);
});

process.on('exit', async () => {
    await mongodb.close();
    await redis.close();
    log('SYSREM_STOP_CLEAN').info('server connection will stop normally.');
});

/** 服务开始监听请求 */
server.listen(port, '0.0.0.0', async () => {
    let _check = setInterval(() => {
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
server.on('error', onError);
server.on('listening', onListening);
