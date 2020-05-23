const _ = require('underscore');

const { isType } = require('../../utils');
const { log } = require('../../configs');

module.exports = socket => {

    /**
     * 发送buffer形式的socket信息
     *
     * @param {*} message
     * @returns
     */
    socket.sendAsBuffer = message => {
        if (_.isString(message)) {
            message = Buffer.from(message);
        } else if (_.isObject(message)) {
            message = Buffer.from(JSON.stringify(message));
        } else {
            log('send-as-buffer').error(`we do not support type ${isType(message)} of message, message is :`);
            log('send-as-buffer').error(message);
            return;
        }

        return socket.send(message);
    };
};
