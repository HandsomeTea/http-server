debugger; /* eslint-disable-line*/
require('./startup');

const { logModule, auditModule } = require('./config/log.type');

process.on('unhandledRejection', reason => {
    // 处理没有catch的promiss，第二个参数即为promiss
    log(logModule.system).fatal(reason);
    audit(auditModule.system).fatal(reason);
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
const server = http.createServer(app);

/** Event listener for HTTP server "error" event. */
const onError = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            log(logModule.startup).error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log(logModule.startup).error(`${bind} is already in use`);
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

    log(logModule.startup).info(`${process.env.SERVER_NAME} listening on ${bind}.`);
    log(logModule.startup).info(`api document running on http://127.0.0.1:${addr.port} .`);
    debugger; /* eslint-disable-line*/
};


const redis = require('./src/service/redis/redis');
const mongodb = require('./src/service/mongodb/mongo');
/**
 * 当服务将要停止时的钩子函数
 */
const _willShutDown = async () => {
    log(logModule.stop).info('server connection will stop normally.');
    await mongodb.closeMongoConnection();
    await redis.quitRedis();
    process.on('SIGINT', () => {
        process.exit(0);
    });
};

/**
 * 健康检查的钩子函数
 */
const _healthCheck = async () => {
    const result = mongodb.mongoStatus() === true && redis.redisStatus() === true;

    if (!result) {
        log(logModule.startup).fatal('system is shut down.');
        throw new Error('wqeqw');
    }
    log(logModule.startup).debug('system is normal.');
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

/** 服务开始监听请求 */
server.listen(port, '0.0.0.0', () => {
    if (process.send) {
        const _fn = async () => {
            const result = mongodb.mongoStatus() === true && redis.redisStatus() === true;

            if (result) {
                process.send('ready');
                clearTimeout(_check);/* eslint-disable-line no-use-before-define*/
            }
        };
        var _check = setTimeout(_fn, 1000);/* eslint-disable-line no-var*/
    }
});
server.on('error', onError);
server.on('listening', onListening);
