import BaseDb from './_base';

class Session extends BaseDb {
    /**
     * Creates an instance of Session.
     * @memberof Session
     */
    constructor() {
        const _model = {
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
                    instanceId: process.env.INSTANCEID,
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
    async deleteUserSession(user: { userId: string, type?: 'guest' | 'system-user', tenantId?: string }, connectionId: string) {
        const { userId } = user;

        await this.updateOne({ _id: userId }, {
            $pull: {
                connections: { id: connectionId }
            }
        });
    }

    /**
     * 删除已经宕机的instance下的session
     */
    async deleteSessionBesidesAliveInstances(unusedInstances: Array<string>) {
        if (unusedInstances.length > 0) {
            await this.updateMany({}, {
                $pull: {
                    'connections': { instanceId: { $in: unusedInstances } }
                }
            });
        }
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
    async findUserSession(userId: string, connectionId?: string): Promise<Array<SocketSession> | undefined> {
        const result = await this.findOne({ _id: userId, ...connectionId ? { 'connections.id': connectionId } : {} }) as SessionModel;

        if (result) {
            if (connectionId) {
                return result.connections.filter(_session => _session.id === connectionId);
            } else {
                return result.connections;
            }
        }
        return;
    }
}

export default new Session();
