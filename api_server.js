/* eslint-disable no-console */
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();


app.use(express.static(path.resolve(__dirname, 'doc')));
app.get('/', (req, res) => {
    let apidoc = path.resolve(__dirname, 'doc/index.html');

    if (fs.existsSync(apidoc)) {
        res.sendFile(apidoc);
    } else {
        res.send('文档未找到或未生成.');
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
            console.error(`[api-doc] ${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`[api-doc] ${bind} is already in use`);
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

    console.info(`[api-doc] api doc server listening on ${bind} and running on http://localhost:${addr.port} .`);
};

server.listen(port, '0.0.0.0');
server.on('error', onError);
server.on('listening', onListening);
