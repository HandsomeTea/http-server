import BaseDAL from './base';

import { getENV } from '@/configs';
import { MongoInstance } from '@/models/mongo';

class InstanceDAL extends BaseDAL {
    constructor() {
        super();
    }

    async insertSystemInstance() {
        if (this.db === 'mongodb') {
            await MongoInstance.insertOne({ instance: getENV('INSTANCEID') } as InstanceModel);
        }
    }

    async upsertSystemInstance() {
        if (this.db === 'mongodb') {
            await MongoInstance.upsertOne({ instance: getENV('INSTANCEID') }, { $set: { instance: getENV('INSTANCEID') } });
        }
    }

    async getUnusedInstance(): Promise<string[]> {
        if (this.db === 'mongodb') {
            const list = await MongoInstance.find({ _updatedAt: { $lt: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) } });

            return list.map(a => a.instance);
        }
        return [];
    }

    async getAliveInstance(): Promise<string[]> {
        if (this.db === 'mongodb') {
            const list = await MongoInstance.find({ _updatedAt: { $gte: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) } });

            return list.map(a => a.instance);
        }
        return [];
    }

    async deleteUnusedInstance() {
        if (this.db === 'mongodb') {
            await MongoInstance.removeMany({ _updatedAt: { $lt: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) } });
        }
    }
}

export default new InstanceDAL();
