import WS from 'ws';
import _ from 'underscore';

import { log, errorType } from '../configs';
import { MyWebSocket } from '../../websocket';

export default new class WebsocketService {
    constructor() {
        //
    }

    get connectionNum() {
        return global.WebsocketServer?.clients.size || 0;
    }

    get onlineConnectionNum() {
        let num = 0;

        global.WebsocketServer?.wsClients.forEach(client => {
            if (client.readyState === WS.OPEN && client.attempt.userId) {
                num++;
            }
        });

        return num;
    }

    get onLineUserNum() {
        const _temp: Set<string> = new Set();

        global.WebsocketServer?.wsClients.forEach(client => {
            if (client.readyState === WS.OPEN && client.attempt.userId) {
                _temp.add(client.attempt.userId);
            }
        });

        return _temp.size;
    }

    /**
     * 获取当前instance某个用户有几个客户端登录
     */
    getLoginClientCountByUserId(userId: string) {
        let num = 0;

        global.WebsocketServer?.wsClients.forEach(client => {
            if (client.readyState === WS.OPEN && client.attempt.userId === userId) {
                num++;
            }
        });

        return num;
    }

    /**
     * 根据userId获取对应的客户端连接
     */
    getSocketsByUserIds(userIds: Array<string>): Set<MyWebSocket> {
        const _userId = new Set(userIds);
        const targetMap = _.pick(global.WebsocketUserIdMap, ..._userId);
        const userIdsAllClients: Set<MyWebSocket> = new Set();

        _.values(targetMap).map(oneUserClients => {
            oneUserClients.forEach((client: MyWebSocket) => {
                if (client.readyState === WS.OPEN) {
                    userIdsAllClients.add(client);
                }
            });
        });

        return userIdsAllClients;
    }

    /**
     * 根据租户id获取对应的客户端连接
     */
    getSocketsByTenantIds(tenantIds: Array<string>): Set<MyWebSocket> {
        const tenantIdList = new Set(tenantIds);
        const tenantIdsAllClients: Set<MyWebSocket> = new Set();

        global.WebsocketServer?.wsClients.forEach(client => {
            if (client.readyState === WS.OPEN && client.attempt.userTenantId && tenantIdList.has(client.attempt.userTenantId)) {
                tenantIdsAllClients.add(client);
            }
        });

        return tenantIdsAllClients;
    }

    /**
     *
     *
     * @param {({
     *             userId?: string,
     *             tenantId?: Array<string> | string
     *         })} target 要被登出的用户_id/tenantId
     * @param {({
     *             connectionId?: Array<string> | string
     *             deviceType?: Array<DeviceType> | DeviceType
     *             model?: Array<DeviceModel> | DeviceModel
     *             serialNumber?: Array<string> | string
     *         })} [option]
     * @param {boolean} [queryNotMatched=false] option否是为不匹配的条件，默认为false(即满足option条件的客户端才被登出，如果为true，则不满足option条件的客户端才被登出)
     */
    public logoutUser(
        target: {
            userId?: string,
            tenantId?: Array<string> | string
        },
        option?: {
            connectionId?: Array<string> | string
            deviceType?: Array<DeviceType> | DeviceType
            model?: Array<DeviceModel> | DeviceModel
            serialNumber?: Array<string> | string
        },
        queryNotMatched = false
    ) {
        const connectionId: Set<string> = typeof option?.connectionId === 'string' ? new Set([option?.connectionId]) : Array.isArray(option?.connectionId) ? new Set(option?.connectionId) : new Set();
        const deviceType: Set<DeviceType> = typeof option?.deviceType === 'string' ? new Set([option?.deviceType]) : Array.isArray(option?.deviceType) ? new Set(option?.deviceType) : new Set();
        const model: Set<DeviceModel> = typeof option?.model === 'string' ? new Set([option?.model]) : Array.isArray(option?.model) ? new Set(option?.model) : new Set();
        const serialNumber: Set<string> = typeof option?.serialNumber === 'string' ? new Set([option?.serialNumber]) : Array.isArray(option?.serialNumber) ? new Set(option?.serialNumber) : new Set();
        const tenantId: Set<string> = typeof target.tenantId === 'string' ? new Set([target.tenantId]) : Array.isArray(target.tenantId) ? new Set(target.tenantId) : new Set();
        const _clients = target.userId ? global.WebsocketUserIdMap[target.userId] || new Set() : this.getSocketsByTenantIds(Array.from(tenantId));

        for (const client of _clients) {
            if (client.readyState === WS.OPEN && client.attempt.connection.device) {
                let shouldClose = true;

                if (connectionId.size > 0 && connectionId.has(client.attempt.connection.id) === queryNotMatched) {
                    shouldClose = false;
                }

                if (deviceType.size > 0 && deviceType.has(client.attempt.connection.device.deviceType) === queryNotMatched) {
                    shouldClose = false;
                }

                if (model.size > 0 && model.has(client.attempt.connection.device.model) === queryNotMatched) {
                    shouldClose = false;
                }

                if (serialNumber.size > 0 && serialNumber.has(client.attempt.connection.device.serialNumber) === queryNotMatched) {
                    shouldClose = false;
                }

                if (tenantId.size > 0 && client.attempt.userTenantId && tenantId.has(client.attempt.userTenantId) === queryNotMatched) {
                    shouldClose = false;
                }

                if (shouldClose === true) {
                    log('socket-logout-user').info(`user id : ${client.attempt.userId}, connection id : ${JSON.stringify(client.attempt.connection.id)} will be logout.`);
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
                        if (client?.close) {
                            client.close();
                        }
                    }, 3 * 1000);
                }
            }
        }
    }
};
