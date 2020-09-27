// const ping = require('./ping');
const onping = require('./onping');
const sendAsBuffer = require('./sendAsBuffer');
const err = require('./error');
const use = require('./use');
const close = require('./close');

module.exports = socket => {
    err(socket);
    sendAsBuffer(socket);
    onping(socket);
    // ping(socket);
    use(socket);
    close(socket);
};
