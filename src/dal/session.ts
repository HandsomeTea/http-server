import BaseDAL from './base';
import { MongoSession } from '@/models/mongo';
import Instances from './instance';
import { getENV } from '@/configs';

class SessionDAL extends BaseDAL {
    constructor() {
        super();
    }

    async findById(id: string): Promise<SessionModel | null> {
        if (this.db === 'mongodb') {
            return await MongoSession.findById(id);
        }
        return null;
    }

    /**
     * 添加一个session
     */
    async insertUserSession(user: { userId: string, tenantId: string, hashedToken: string }, connectionId: string, device: Device, isGuest = false) {
        const timestamp = new Date();
        const { userId, tenantId, hashedToken } = user;
        const type = isGuest ? 'guest' : 'system-user';

        if (this.db === 'mongodb') {
            await MongoSession.upsertOne({ _id: userId }, {
                $addToSet: {
                    connections: {
                        id: connectionId,
                        hashedToken,
                        instanceId: getENV('INSTANCEID'),
                        status: 'online',
                        type,
                        tenantId,
                        device: { ...device || {}, tenantId },
                        _createdAt: timestamp,
                        _updatedAt: timestamp
                    }
                }
            });
        }
    }

    /**
     * 更改用户在session中的状态
     */
    async updateSessionStatus(userId: string, connectionId: string, status: 'online' | 'away' | 'busy') {
        if (this.db === 'mongodb') {
            await MongoSession.updateOne({ _id: userId, 'connections.id': connectionId }, {
                $set: {
                    'connections.$.status': status,
                    'connections.$._updatedAt': new Date()
                }
            });
        }
    }

    /**
     * 删除用户的一个session
     */
    async deleteUserSession(userId: string, connectionId: string) {
        if (this.db === 'mongodb') {
            await MongoSession.updateOne({ _id: userId }, {
                $pull: {
                    connections: { id: connectionId }
                }
            });
        }
    }

    /**
     * 删除已经宕机的instance下的session，留下现在依然工作的instance下的session
     */
    async deleteUnusedSession() {
        const aliveInstances = await Instances.getAliveInstance();

        if (this.db === 'mongodb') {
            await MongoSession.updateMany({}, {
                $pull: {
                    'connections': { instanceId: { $nin: aliveInstances } }
                }
            });
        }
    }

    /**
     * 删除数据库中空的session数据
     */
    async deleteEmptyData() {
        if (this.db === 'mongodb') {
            await MongoSession.removeMany({ connections: { $size: 0 } });
        }
    }

    /**
     * 查询用户的session
     */
    async findUserSession(userId: string, connectionId?: string): Promise<Array<SocketSession>> {
        if (this.db === 'mongodb') {
            const result = await MongoSession.findOne({ _id: userId, ...connectionId ? { 'connections.id': connectionId } : {} });

            if (result) {
                if (connectionId) {
                    return result.connections.filter(_session => _session.id === connectionId);
                } else {
                    return result.connections;
                }
            }
        }
        return [];
    }
}


export default new SessionDAL();
