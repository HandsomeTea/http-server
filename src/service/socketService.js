const WS = require('ws');

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
     * 登出某个用户在当前instance下的所有客户端,如果有connectionId,则只登出connectionId对应的客户端
     *
     * @param {*} userId
     * @param {string} [connectionId='']
     */
    logoutUser(userId, connectionId = '') {
        for (const client of this.server.clients) {
            if (client.readyState === WS.OPEN && userId === client.attempt.userId) {
                log('socket-logout-user').debug(`user id : ${client.attempt.userId}, connection id : ${client.attempt.connection.id}`);
                if (connectionId) {
                    if (client.attempt.connection.id === connectionId) {
                        client.close();
                        break;
                    }
                } else {
                    client.close();
                }
            }
        }
    }

    /**
     *
     *
     * @param {string|array} userId 一个或多个用户id
     * @param {*} message
     */
    sendMessageToUsers(userId, message) {
        const _userId = new Set([].concat(userId));

        this.server.clients.forEach(client => {
            if (client.readyState === WS.OPEN && _userId.has(client.attempt.userId)) {
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
            if (client.readyState === WS.OPEN && client.attempt.userId === userId) {
                num++;
            }
        });

        return num;
    }
};
