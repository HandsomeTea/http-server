const WS = require('ws');
const _ = require('underscore');

const { log, errorType } = require('../configs');
const { isArray } = require('../utils');

module.exports = new class WebsocketService {
    constructor() {
        this.server = null;
        this.userIdMap = null;
        this.SNMap = null;

        this._init();
    }

    _init() {
        if (process.env.NODE_ENV !== 'production') {
            setInterval(() => {
                if (global.isServerRunning) {
                    log('socket-count-check').debug(`socket client size is ${this.connectionNum}, socket online client size is ${this.onlineConnectionNum}, online user count is ${this.onLineUserNum}`);
                }
            }, 60 * 1000);
        }

        let _t = setInterval(() => {
            if (global.isServerRunning) {
                this.server = global.WebsocketServer;
                this.userIdMap = global.WebsocketServerMap;
                this.SNMap = global.WebsocketSNMap;
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
     * 获取当前instance某个用户有几个客户端登录
     *
     * @param {string} userId
     * @returns
     */
    getLoginClientCountByUserId(userId) {
        let num = 0;

        this.server.clients.forEach(client => {
            if (client.readyState === WS.OPEN && client.attempt.userId === userId) {
                num++;
            }
        });

        return num;
    }

    /**
     * 根据userId获取对应的客户端连接
     *
     * @param {array} userIds
     * @returns
     */
    getSocketsByUserIds(userIds) {
        const _userId = new Set([].concat(userIds));
        const targetMap = _.pick(this.userIdMap, ..._userId);
        const userIdsAllClients = new Set();

        _.values(targetMap).map(oneUserClients => {
            oneUserClients.forEach(client => {
                if (client.readyState === WS.OPEN) {
                    userIdsAllClients.add(client);
                }
            });
        });

        return userIdsAllClients;
    }

    /**
     * 根据客户端序列号获取对应的客户端连接
     *
     * @param {array} SNs
     * @returns
     */
    getSocketsBySNs(SNs) {
        const SNList = new Set([...[].concat(SNs)]);
        const targetMap = _.pick(this.SNMap, ...SNList);
        const SNsAllClients = new Set();

        _.values(targetMap).map(client => {
            if (client.readyState === WS.OPEN) {
                SNsAllClients.add(client);
            }
        });

        return SNsAllClients;
    }

    /**
     * 根据租户id获取对应的客户端连接
     *
     * @param {array} tenantIds
     * @returns
     */
    getSocketsByTenantIds(tenantIds) {
        const tenantIdList = new Set([...[].concat(tenantIds)]);
        const tenantIdsAllClients = new Set();

        this.server.clients.forEach(client => {
            if (client.readyState === WS.OPEN && tenantIdList.has(client.attempt.userTenantId)) {
                tenantIdsAllClients.add(client);
            }
        });

        return tenantIdsAllClients;
    }

    /**
     * 登出某个用户在当前instance下的某些客户端
     *
     * @param {string} userId 要被登出的用户_id
     * @param {object} [option={ _connectionId: [], _deviceType: [], _model: [], _serialNumber: [] }] 每个条件均可传多个
     * @param {array} [option._connectionId]
     * @param {array} [option._deviceType]
     * @param {array} [option._model]
     * @param {array} [option._serialNumber]
     * @param {boolean} [queryNotMatched=false] option否是为不匹配的条件，默认为false(即满足option条件的客户端才被登出，如果为true，则不满足option条件的客户端才被登出)
     * @returns {objec} { closedToken: string[] }
     */
    logoutUser(userId, option = { _connectionId: [], _deviceType: [], _model: [], _serialNumber: [] }, queryNotMatched = false) {
        const { _connectionId, _deviceType, _model, _serialNumber } = option;
        const connectionId = isArray(_connectionId) && _connectionId.length > 0 ? new Set([..._connectionId]) : new Set();
        const deviceType = isArray(_deviceType) && _deviceType.length > 0 ? new Set([..._deviceType]) : new Set();
        const model = isArray(_model) && _model.length > 0 ? new Set([..._model]) : new Set();
        const serialNumber = isArray(_serialNumber) && _serialNumber.length > 0 ? new Set([..._serialNumber]) : new Set();
        const _clients = this.userIdMap[userId] || new Set();

        for (const client of _clients) {
            if (client.readyState === WS.OPEN) {
                let shouldClose = true;

                if (connectionId.size > 0 && connectionId.has(client.attempt.connection.id) === queryNotMatched) {
                    shouldClose = false;
                }

                if (deviceType.size > 0 && client.attempt.connection.device && client.attempt.connection.device.deviceType && deviceType.has(client.attempt.connection.device.deviceType) === queryNotMatched) {
                    shouldClose = false;
                }

                if (model.size > 0 && client.attempt.connection.device && client.attempt.connection.device.model && model.has(client.attempt.connection.device.model) === queryNotMatched) {
                    shouldClose = false;
                }

                if (serialNumber.size > 0 && client.attempt.connection.device && client.attempt.connection.device.serialNumber && serialNumber.has(client.attempt.connection.device.serialNumber) === queryNotMatched) {
                    shouldClose = false;
                }

                if (shouldClose === true) {
                    log('socket-logout-user').info(`user id : ${client.attempt.userId}, connection id : ${JSON.stringify(client.attempt.connection)} will be logout.`);
                    client.send(JSON.stringify({
                        msg: 'changed',
                        collection: 'stream-surpass-notify-user',
                        id: 'id',
                        fields: {
                            eventName: `${client.attempt.userId}/trans_server_autonomy`,
                            args: [{
                                event: 'trans_autonomic_action',
                                action: errorType.BE_LOGOUT,
                                signal: errorType.BE_LOGOUT
                            }]
                        }
                    }));
                    setTimeout(() => {
                        if (client && client.close) {
                            client.close();
                        }
                    }, 3 * 1000);
                }
            }
        }
    }
};
