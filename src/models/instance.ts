import { SchemaDefinition } from 'mongoose';

import BaseDb from './_mongodb';

class Instance extends BaseDb<InstanceModel> {
    /**
     * Creates an instance of Instance.
     * @memberof Instance
     */
    constructor() {
        const _model: SchemaDefinition = {
            _id: { type: String, required: true, trim: true },
            instance: { type: String }
        };

        super('instances', _model);
    }

    async insertSystemInstance() {
        return await this.create({ instance: process.env.INSTANCEID } as InstanceModel);
    }

    async upsertSystemInstance() {
        return await this.upsertOne({ instance: process.env.INSTANCEID }, { $set: { instance: process.env.INSTANCEID } });
    }

    async getUnusedInstance() {
        const list = await this.find({ _updatedAt: { $lt: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) } });

        return list.map(a => a.instance);
    }

    async getAliveInstance() {
        const list = await this.find({ _updatedAt: { $gte: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) } });

        return list.map(a => a.instance);
    }

    async deleteUnusedInstance() {
        return await this.removeMany({ _updatedAt: { $lt: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) } });
    }
}

export default new Instance();
