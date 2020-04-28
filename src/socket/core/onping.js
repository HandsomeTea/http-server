const { log } = require('../../configs');

/**从服务器向客户端发出ping消息，已经取消 */
module.exports = socket => {
    socket.on('ping', ping => {
        log('ping-from-client').debug(`client ${socket.attempt.connection.id} ping message is : ${ping}`);
    });
};
