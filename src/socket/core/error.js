const { log } = require('../../configs');

module.exports = socket => {
    socket.on('error', err => {
        log('socket-error').error(err);
    });
};
