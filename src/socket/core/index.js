const ping = require('./ping');
const err = require('./error');
const use = require('./use');

module.exports = socket => {
    err(socket);
    ping(socket);
    use(socket);
};
