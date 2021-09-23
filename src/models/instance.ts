import { SchemaDefinition } from 'mongoose';
import BaseDb from './_mongodb';

class Instance extends BaseDb {
    /**
     * Creates an instance of Instance.
     * @memberof Instance
     */
    constructor() {
        const _model: SchemaDefinition<InstanceModel> = {
            _id: { type: String, required: true, trim: true },
            instance: { type: String }
        };

        super('instances', _model);
    }

    async insertSystemInstance() {
        return await this.create({ instance: process.env.INSTANCEID } as InstanceModel);
    }

    async updateSystemInstance() {
        return await this.updateOne({ instance: process.env.INSTANCEID }, { $set: { instance: process.env.INSTANCEID } });
    }

    async getUnusedInstance() {
        const list = await this.find({ _updatedAt: { $lt: new Date(new Date().getTime() - global.IntervalCleanSessionOfInstance * 1000 - 2 * 1000) } }) as Array<InstanceModel>;

        return list.map(a => a.instance);
    }

    async getAliveInstance() {
        const list = await this.find({ _updatedAt: { $gte: new Date(new Date().getTime() - global.IntervalCleanSessionOfInstance * 1000 - 2 * 1000) } }) as Array<InstanceModel>;

        return list.map(a => a.instance);
    }

    async deleteUnusedInstance(unusedInstance: Array<string>) {
        return await this.removeMany({ instance: { $in: unusedInstance } });
    }
}

export default new Instance();
