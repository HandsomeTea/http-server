import BaseDal from './base';
import { ScheduledMongo, ScheduledTaskMongo } from '@/models/mongo';
// import { SqlScheduled, SqlScheduledTask } from '@/models/sql';
// import { DaMengScheduled, DaMengScheduledTask } from '@/models/dameng';
// import { Op } from 'sequelize';

export default new class ScheduledDal extends BaseDal {
    constructor() {
        super();
    }

    async getShouldExcuteTask(): Promise<Array<ScheduledTaskModel>> {
        if (this.db === 'mongodb') {
            return await ScheduledTaskMongo.find({ hitTime: { $lt: new Date() } });
        }
        //  else if (this.db === 'sqldb') {
        //     return await SqlScheduledTask.find({
        //         where: {
        //             hitTime: { [Op.lt]: new Date() }
        //         }
        //     });
        // } else if (this.db === 'dmdb') {
        //     return await DaMengScheduledTask.find({
        //         where: {
        //             hitTime: { $lt: new Date() }
        //         }
        //     });
        // }
        return [];
    }

    async findOneScheduled(scheduledInfo: { _id?: ScheduledType }): Promise<ScheduledModel | null> {
        const { _id } = scheduledInfo;

        if (this.db === 'mongodb') {
            return await ScheduledMongo.findOne({ _id });
        }
        // else if (this.db === 'sqldb') {
        //     return await SqlScheduled.findOne({
        //         where: {
        //             _id
        //         }
        //     });
        // } else if (this.db === 'dmdb') {
        //     return await DaMengScheduled.findOne({
        //         where: {
        //             _id
        //         }
        //     });
        // }
        return null;
    }

    async createTask(data: ScheduledTaskModel): Promise<string> {
        if (this.db === 'mongodb') {
            return (await ScheduledTaskMongo.insertOne(data))._id;
        }
        // else if (this.db === 'sqldb') {
        //     return (await SqlScheduledTask.insert(data._id ? data : {
        //         ...data,
        //         _id: data._id || SqlScheduledTask.randomId
        //     }))._id;
        // } else if (this.db === 'dmdb') {
        //     const _id = data._id || DaMengScheduledTask.randomId;

        //     await DaMengScheduledTask.insert(data._id ? data : {
        //         ...data,
        //         _id
        //     });
        //     return _id;
        // }
        return '';
    }

    async createScheduled(data: ScheduledModel): Promise<string> {
        if (this.db === 'mongodb') {
            return (await ScheduledMongo.insertOne(data))._id;
        }
        // else if (this.db === 'sqldb') {
        //     return (await SqlScheduled.insert({
        //         _id: data._id,
        //         tenantId: data.tenantId,
        //         name: data.name,
        //         startTime: data.startTime,
        //         endTime: data.endTime,
        //         hitTime: data.hitTime,
        //         cycle: data.cycle,
        //         cycleUnit: data.cycleUnit
        //     }))._id;
        // } else if (this.db === 'dmdb') {
        //     await SqlScheduled.insert({
        //         _id: data._id,
        //         tenantId: data.tenantId,
        //         name: data.name,
        //         startTime: data.startTime,
        //         endTime: data.endTime,
        //         hitTime: data.hitTime,
        //         cycle: data.cycle,
        //         cycleUnit: data.cycleUnit
        //     });
        //     return data._id;
        // }
        return '';
    }

    async removeTask(option: { _id?: string, type?: ScheduledTaskType, belongId?: ScheduledType }) {
        if (this.db === 'mongodb') {
            await ScheduledTaskMongo.removeMany(option);
        }
        // else if (this.db === 'sqldb') {
        //     await SqlScheduledTask.delete({
        //         where: option
        //     });
        // } else if (this.db === 'dmdb') {
        //     await DaMengScheduledTask.delete({
        //         where: option
        //     });
        // }
    }

    async removeScheduled(option: { _id?: ScheduledType }) {
        const { _id } = option;

        if (this.db === 'mongodb') {
            await ScheduledMongo.removeMany({ _id });
        }
        // else if (this.db === 'sqldb') {
        //     await SqlScheduled.delete({
        //         where: {
        //             _id
        //         }
        //     });
        // } else if (this.db === 'dmdb') {
        //     await DaMengScheduled.delete({
        //         where: {
        //             _id
        //         }
        //     });
        // }
    }

    async updateScheduled(option: { _id?: ScheduledType }, update: {
        name?: string,
        startTime?: Date,
        endTime?: Date,
        hitTime?: string,
        cycle?: number,
        cycleUnit?: 'hour' | 'day' | 'week'
    }) {
        // const { _id } = option;

        if (this.db === 'mongodb') {
            await ScheduledMongo.updateMany(option, { $set: update });
        }
        // else if (this.db === 'sqldb') {
        //     await SqlScheduled.update({
        //         where: {
        //             _id
        //         }
        //     }, update);
        // } else if (this.db === 'dmdb') {
        //     await DaMengScheduled.update({
        //         where: {
        //             _id
        //         }
        //     }, update);
        // }
    }
};
