const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();

const { log } = require('./utils');

app.use(express.static(path.resolve(process.env.INIT_CWD, 'doc')));
app.get('/', (req, res) => {
    let apidoc = path.resolve(process.env.INIT_CWD, 'doc/index.html');

    if (fs.existsSync(apidoc)) {
        res.sendFile(apidoc);
    } else {
        res.send('服务器出错...');
    }

});

const server = http.createServer(app);
const port = process.env.DOC_PORT || 3001;
const onError = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            log('api-doc').error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log('api-doc').error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};
const onListening = () => {
    let addr = server.address();

    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

    log('api-doc').info(`api doc service listening on ${bind} .`);
};

server.listen(port, '0.0.0.0');
server.on('error', onError);
server.on('listening', onListening);
