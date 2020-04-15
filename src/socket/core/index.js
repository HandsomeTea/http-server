const ping = require('./ping');
const err = require('./error');
const use = require('./use');
const close = require('./close');

module.exports = socket => {
    err(socket);
    close(socket);
    use(socket);
    ping(socket);
};
