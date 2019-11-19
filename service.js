#!/usr/bin/env node

debugger; /* eslint-disable-line*/
require('./startup');

const { log, audit } = require('./utils');
const { logType, auditType } = require('./conf');

process.on('unhandledRejection', reason => {
    // 处理没有catch的promiss，第二个参数即为promiss
    log(logType.system).fatal(reason);
    audit(auditType.system).fatal(reason);
});

process.on('uncaughtException', err => {
    // 监听未捕获的异常
    log(logType.system).fatal(err);
    audit(auditType.system).fatal(err);
});

/**
 * Module dependencies.
 */
const app = require('./app');
const http = require('http');
const { createTerminus } = require('@godaddy/terminus');


/**
 * Normalize a port into a number, string, or false.
 */

const normalizePort = val => {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
};

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');

app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

const onSignal = () => {
    log(logType.stop).info('server will stop , do you have anything to do?');
    // start cleanup of resource, like databases or file descriptors
};

const onHealthCheck = async () => {
    log(logType.startup).info('is healthy');
    // checks if the system is healthy, like the db connection is live
    // resolves, if health, rejects if not
    // throw new Error('wqeqw');//not healthy
    // return { a: false };//is healthy
};

createTerminus(server, {
    signal: 'SIGINT',
    healthChecks: {
        '/healthcheck': onHealthCheck
    },
    onSignal
});

/**
 * Event listener for HTTP server "error" event.
 */

const onError = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            log(logType.startup).error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log(logType.startup).error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = () => {
    let addr = server.address();

    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

    log(logType.startup).info(`${process.env.SERVICE_NAME} listening on ${bind}`);
    debugger; /* eslint-disable-line*/
};

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, '0.0.0.0');
server.on('error', onError);
server.on('listening', onListening);
