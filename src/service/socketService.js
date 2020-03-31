const { log } = require('../configs');

module.exports = new class WebsocketService {
    constructor() {
        this.server = null;

        this._init();
    }

    _init() {
        let _t = setInterval(() => {
            if (global.isServerRunning) {
                this.server = global.WebsocketServer;
                clearInterval(_t);
                _t = null;
            }
        }, 500);
    }

    /**
     *
     *
     * @param {string|array} userId 一个或多个用户id
     * @param {*} message
     */
    sendMessageToUsers(userId, message) {
        userId = [].concat(userId);

        this.server.clients.forEach(client => {
            if (client.readyState === require('ws').OPEN && userId.includes(client.attempt.userId)) {
                log(`socket-send-to-user-${client.attempt.userId}`).debug(message);
                client.send(JSON.stringify(message));
            }
        });
    }

    /**
     * 获取一个用户有几个客户端在线
     *
     * @param {*} userId
     * @returns
     */
    getLoginClientCount(userId) {
        let num = 0;

        this.server.clients.forEach(client => {
            if (client.readyState === require('ws').OPEN && client.attempt.userId === userId) {
                num++;
            }
        });

        return num;
    }
};
