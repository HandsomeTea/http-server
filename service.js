#!/usr/bin/env node

debugger; /* eslint-disable-line*/

/**
 * Module dependencies.
 */
require('./conf');
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
    console.log('server will stop , do you have anything to do?');
    // start cleanup of resource, like databases or file descriptors
};

const onHealthCheck = async () => {
    console.log('is healthy');
    throw new Error('wqeqw');
    // checks if the system is healthy, like the db connection is live
    // resolves, if health, rejects if not
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
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
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

    console.log(`Listening on ${bind}`);
    debugger; /* eslint-disable-line*/
};

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, '0.0.0.0');
server.on('error', onError);
server.on('listening', onListening);
