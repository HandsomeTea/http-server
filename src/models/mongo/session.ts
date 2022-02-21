import { SchemaDefinition } from 'mongoose';

import Base from './base';
import { Instances } from '@/dal';
import { getENV } from '@/configs';
class Session extends Base<SessionModel> {
    /**
     * Creates an instance of Session.
     * @memberof Session
     */
    constructor() {
        const _model: SchemaDefinition = {
            _id: { type: String, required: true, trim: true },
            connections: { type: Array }
        };

        super('usersSessions', _model);
    }

    /**
     * 添加一个session
     */
    async insertUserSession(user: { userId: string, tenantId: string, hashedToken: string }, connectionId: string, device: Device, isGuest = false) {
        const timestamp = new Date();
        const { userId, tenantId, hashedToken } = user;
        const type = isGuest ? 'guest' : 'system-user';

        await this.upsertOne({ _id: userId }, {
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

    /**
     * 更改用户在session中的状态
     */
    async updateSessionStatus(userId: string, connectionId: string, status: 'online' | 'away' | 'busy') {
        return await this.updateOne({ _id: userId, 'connections.id': connectionId }, {
            $set: {
                'connections.$.status': status,
                'connections.$._updatedAt': new Date()
            }
        });
    }

    /**
     * 删除用户的一个session
     */
    async deleteUserSession(userId: string, connectionId: string) {
        await this.updateOne({ _id: userId }, {
            $pull: {
                connections: { id: connectionId }
            }
        });
    }

    /**
     * 删除已经宕机的instance下的session，留下现在依然工作的instance下的session
     */
    async deleteUnusedSession() {
        const aliveInstances = await Instances.getAliveInstance();

        await this.updateMany({}, {
            $pull: {
                'connections': { instanceId: { $nin: aliveInstances } }
            }
        });
    }

    /**
     * 删除数据库中空的session数据
     */
    async deleteEmptyData() {
        return await this.removeMany({ connections: { $size: 0 } });
    }

    /**
     * 查询用户的session
     */
    async findUserSession(userId: string, connectionId?: string): Promise<Array<SocketSession> | void> {
        const result = await this.findOne({ _id: userId, ...connectionId ? { 'connections.id': connectionId } : {} });

        if (result) {
            if (connectionId) {
                return result.connections.filter(_session => _session.id === connectionId);
            } else {
                return result.connections;
            }
        }
    }
}

export default new Session();
