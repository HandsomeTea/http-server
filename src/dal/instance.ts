import BaseDal from './base';
import { MongoInstances } from '@/models/mongo';
// import { SqlInstance } from '@/models/sql';
// import { DaMengInstance } from '@/models/dameng';
// import { Op } from 'sequelize';

class InstanceDAL extends BaseDal {
    constructor() {
        super();
    }

    async findByInstanceId(instanceId: string): Promise<{
        instance: string,
        assignPasswordShouldBeResetedNoticeData?: {
            tenantIdList?: Array<string>
        }
    } | null> {
        if (this.db === 'mongodb') {
            return await MongoInstances.findOne({ instance: instanceId }, { projection: { assignPasswordShouldBeResetedNoticeData: 1 } });
        }
        // else if (this.db === 'sqldb' || this.db === 'dmdb') {
        //     const data = this.db === 'sqldb' ?
        //         await SqlInstance.findOne({ where: { _id: instanceId } }) :
        //         await DaMengInstance.findOne({ where: { _id: instanceId } });

        //     if (data) {
        //         return {
        //             instance: data._id,
        //             assignPasswordShouldBeResetedNoticeData: {
        //                 tenantIdList: data.assignPasswordResetedNoticeTenantIds?.split(',')
        //             }
        //         };
        //     }
        // }
        return null;
    }

    async insertSystemInstance(): Promise<void> {
        if (this.db === 'mongodb') {
            await MongoInstances.insertOne({ instance: process.env.INSTANCEID } as InstanceModel);
        }
        // else if (this.db === 'sqldb') {
        //     await SqlInstance.insert({ _id: process.env.INSTANCEID } as SqlInstanceModel);
        // } else if (this.db === 'dmdb') {
        //     await DaMengInstance.insert({ _id: process.env.INSTANCEID } as SqlInstanceModel);
        // }
    }

    async upsertSystemInstance(): Promise<void> {
        if (this.db === 'mongodb') {
            await MongoInstances.upsertOne({ instance: process.env.INSTANCEID }, { $set: { instance: process.env.INSTANCEID } });
        }
        // else if (this.db === 'sqldb') {
        //     if (!await SqlInstance.findOne({ where: { _id: process.env.INSTANCEID } })) {
        //         await this.insertSystemInstance();
        //     } else {
        //         await SqlInstance.update({ where: { _id: process.env.INSTANCEID } }, { _id: process.env.INSTANCEID, updatedAt: new Date() });
        //     }
        // } else if (this.db === 'dmdb') {
        //     await DaMengInstance.upsert({ where: { _id: process.env.INSTANCEID } }, { updatedAt: new Date() }, { _id: process.env.INSTANCEID } as SqlInstanceModel);
        // }
    }

    async getUnusedInstance(): Promise<string[]> {
        if (this.db === 'mongodb') {
            const list = await MongoInstances.find({
                updatedAt: { $lt: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) }
            });

            return list.map(a => a.instance);
        }
        // else if (this.db === 'sqldb' || this.db === 'dmdb') {
        //     const list = this.db === 'sqldb' ?
        //         await SqlInstance.find({
        //             where: {
        //                 updatedAt: {
        //                     [Op.lt]: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000)
        //                 }
        //             }
        //         }) :
        //         await DaMengInstance.find({
        //             where: {
        //                 updatedAt: {
        //                     $lt: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000)
        //                 }
        //             }
        //         });

        //     return list.map(a => a._id);
        // }
        return [];
    }

    async getAliveInstance(): Promise<string[]> {
        if (this.db === 'mongodb') {
            const list = await MongoInstances.find({
                updatedAt: { $gte: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) }
            });

            return list.map(a => a.instance);
        }
        //  else if (this.db === 'sqldb' || this.db === 'dmdb') {
        //     const list = this.db === 'sqldb' ?
        //         await SqlInstance.find({
        //             where: {
        //                 updatedAt: {
        //                     [Op.gte]: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000)
        //                 }
        //             }
        //         }) :
        //         await DaMengInstance.find({
        //             where: {
        //                 updatedAt: {
        //                     $gte: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000)
        //                 }
        //             }
        //         });

        //     return list.map(a => a._id);
        // }
        return [];
    }

    async deleteUnusedInstance(): Promise<void> {
        if (this.db === 'mongodb') {
            await MongoInstances.removeMany({
                updatedAt: { $lt: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000) }
            });
        }
        // else if (this.db === 'sqldb') {
        //     await SqlInstance.delete({
        //         where: {
        //             updatedAt: {
        //                 [Op.lt]: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000)
        //             }
        //         }
        //     });
        // } else if (this.db === 'dmdb') {
        //     await DaMengInstance.delete({
        //         where: {
        //             updatedAt: {
        //                 $lt: new Date(new Date().getTime() - global.IntervalCleanUnusedInstance * 1000 - 2 * 1000)
        //             }
        //         }
        //     });
        // }
    }
}

export default new InstanceDAL();
