import BaseDAL from './base';
import redis from '@/tools/redis';
import { _MongoUser } from '@/models/mongo';
import { _MysqlUser } from '@/models/mysql';


export default class UserDAL extends BaseDAL {
    private tId!: string;
    private mongoServer!: _MongoUser;
    private mysqlServer!: _MysqlUser;

    constructor(tenantId: string) {
        super();
        this.tId = tenantId;

        if (this.db === 'mongodb') {
            this.mongoServer = new _MongoUser(this.tId);
        } if (this.db === 'mysql') {
            this.mysqlServer = new _MysqlUser(this.tId);
        }
    }

    private catchUserKey(userId: string): string {
        return `user_service:tenantId_${this.tId}:${userId}`;
    }

    async insert(user: UserModel): Promise<UserModel> {
        if (this.db === 'mongodb') {
            return await this.mongoServer.insertOne(user);
        } else {
            return await this.mysqlServer.insert(user);
        }
    }

    async findById(userId: string): Promise<UserModel | null> {
        const redisResult = await redis.server.get(this.catchUserKey(userId));

        if (redisResult) {
            return JSON.parse(redisResult) as UserModel;
        }
        let result: null | UserModel = null;

        if (this.db === 'mongodb') {
            result = await this.mongoServer.findById(userId);
        } else if (this.db === 'mysql') {
            result = await this.mysqlServer.findById(userId);
        }

        if (!result) {
            return null;
        }
        await redis.server.set(this.catchUserKey(userId), JSON.stringify(result), 'EX', Math.floor(Math.random() * 11 + 50) * 60); //秒为单位
        return result;
    }
}
