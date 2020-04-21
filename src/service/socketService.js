const WS = require('ws');
const _ = require('underscore');

const { log } = require('../configs');

module.exports = new class WebsocketService {
    constructor() {
        this.server = null;
        this.serverMap = null;

        this._init();
    }

    _init() {
        let _t = setInterval(() => {
            if (global.isServerRunning) {
                this.server = global.WebsocketServer;
                this.serverMap = global.WebsocketServerMap;
                clearInterval(_t);
                _t = null;
            }
        }, 500);
    }

    get connectionNum() {
        return this.server.clients.size;
    }

    get onlineConnectionNum() {
        let num = 0;

        this.server.clients.forEach(client => {
            if (client.readyState === WS.OPEN && client.attempt.userId) {
                num++;
            }
        });

        return num;
    }

    get onLineUserNum() {
        let _temp = new Set();

        this.server.clients.forEach(client => {
            if (client.readyState === WS.OPEN && client.attempt.userId) {
                _temp.add(client.attempt.userId);
            }
        });

        return _temp.size;
    }

    /**
     * 登出某个用户在当前instance下的所有客户端,如果有connectionId,则只登出connectionId对应的客户端
     *
     * @param {*} userId
     * @param {string} [connectionId='']
     */
    logoutUser(userId, connectionId = '') {
        if (!userId) {
            return;
        }
        const _clients = this.serverMap[userId] || new Set();

        if (_clients.size > 0) {
            for (const client of _clients) {
                if (client.readyState === WS.OPEN) {
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
    }

    /**
     *
     *
     * @param {string|array} userId 一个或多个用户id
     * @param {*} message
     */
    async sendMessageToUsers(userId, message) {
        const _userId = new Set([].concat(userId));
        const targetMap = _.pick(this.serverMap, ..._userId);

        let targetClients = new Set();

        _.values(targetMap).map(c => {
            targetClients = new Set([...targetClients, ...c]);
        });

        for (const client of targetClients) {
            if (client.readyState === WS.OPEN) {
                log(`socket-send-to-user-${client.attempt.userId}`).debug(message);
                client.send(JSON.stringify(message));
            }
        }
    }

    /**
     * 获取当前instance某个用户有几个客户端登录
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
