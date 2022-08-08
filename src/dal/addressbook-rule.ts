import BaseDal from './base';
import { _MongoAddressBookRules } from '@/models/mongo';
// import { _SqlAddressBookRules, _SqlAddressBookRuleDatas } from '@/models/sql';
// import { _DaMengAddressBookRules, _DaMengAddressBookRuleDatas } from '@/models/dameng';
// import { Op } from 'sequelize';

export default class _AddressBookRulesDal extends BaseDal {
    private mongoServer!: _MongoAddressBookRules;
    // private sqlRuleServer!: _SqlAddressBookRules;
    // private sqlRuleDataServer!: _SqlAddressBookRuleDatas;
    // private dmRuleServer!: _DaMengAddressBookRules;
    // private dmRuleDataServer!: _DaMengAddressBookRuleDatas;

    constructor(_tenantId: string) {
        super();
        if (this.db === 'mongodb') {
            this.mongoServer = new _MongoAddressBookRules(_tenantId);
        }
        // else if (this.db === 'sqldb') {
        //     this.sqlRuleServer = new _SqlAddressBookRules(_tenantId);
        //     this.sqlRuleDataServer = new _SqlAddressBookRuleDatas(_tenantId);
        // } else if (this.db === 'dmdb') {
        //     this.dmRuleServer = new _DaMengAddressBookRules(_tenantId);
        //     this.dmRuleDataServer = new _DaMengAddressBookRuleDatas(_tenantId);
        // }
    }

    // private formatRuleDataForSql(sqlRule: Array<SqlAddressbookRuleModel>, sqlRuleData: Array<SqlAddressBookRuleDataModel>) {
    //     const result: Array<AddressbookRuleModel> = [];

    //     sqlRule.map(rule => {
    //         result.push({
    //             _id: rule._id,
    //             name: rule.name,
    //             hiddenToAll: rule.hiddenToAll === 1 ? true : false,
    //             visibleToSelfOrg: rule.visibleToSelfOrg === 1 ? true : false,
    //             targetUserIds: sqlRuleData.filter(a => a.type === 1 && a.ruleId === rule._id).map(b => b.data),
    //             targetDepartmentIds: sqlRuleData.filter(a => a.type === 2 && a.ruleId === rule._id).map(b => b.data),
    //             hiddenUserIds: sqlRuleData.filter(a => a.type === 3 && a.ruleId === rule._id).map(b => b.data),
    //             visibleUserIds: sqlRuleData.filter(a => a.type === 4 && a.ruleId === rule._id).map(b => b.data),
    //             hiddenDepartmentIds: sqlRuleData.filter(a => a.type === 5 && a.ruleId === rule._id).map(b => b.data),
    //             visibleDepartmentIds: sqlRuleData.filter(a => a.type === 6 && a.ruleId === rule._id).map(b => b.data)
    //         });
    //     });

    //     return result;
    // }

    async create(data: AddressbookRuleModel): Promise<string> {
        if (this.db === 'mongodb') {
            return (await this.mongoServer.insertOne(data))._id;
        }
        // else if (this.db === 'sqldb' || this.db === 'dmdb') {
        //     const ruleId = data._id || this.sqlRuleServer.randomId;

        //     if (this.db === 'sqldb') {
        //         await this.sqlRuleServer.insert({
        //             _id: ruleId,
        //             name: data.name,
        //             hiddenToAll: data.hiddenToAll === true ? 1 : 0,
        //             visibleToSelfOrg: data.visibleToSelfOrg === true ? 1 : 0
        //         });
        //     } else {
        //         await this.dmRuleServer.insert({
        //             _id: ruleId,
        //             name: data.name,
        //             hiddenToAll: data.hiddenToAll === true ? 1 : 0,
        //             visibleToSelfOrg: data.visibleToSelfOrg === true ? 1 : 0
        //         });
        //     }

        //     const insertData: Array<SqlAddressBookRuleDataModel> = [];

        //     data.targetUserIds.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId,
        //             data: a,
        //             type: 1
        //         });
        //     });
        //     data.targetDepartmentIds.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId,
        //             data: a,
        //             type: 2
        //         });
        //     });
        //     data.hiddenUserIds.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId,
        //             data: a,
        //             type: 3
        //         });
        //     });
        //     data.visibleUserIds.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId,
        //             data: a,
        //             type: 4
        //         });
        //     });
        //     data.hiddenDepartmentIds.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId,
        //             data: a,
        //             type: 5
        //         });
        //     });
        //     data.visibleDepartmentIds.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId,
        //             data: a,
        //             type: 6
        //         });
        //     });

        //     if (this.db === 'sqldb') {
        //         await this.sqlRuleDataServer.insertMany(insertData);
        //     } else {
        //         for (let i = 0; i < insertData.length; i++) {
        //             await this.dmRuleDataServer.insert(insertData[i]);
        //         }
        //     }
        //     return ruleId;
        // }

        return '';
    }

    async removeUserFromRule(userId: string) {
        if (this.db === 'mongodb') {
            await this.mongoServer.updateMany({
                $or: [
                    { targetUserIds: { $in: [userId] } },
                    { hiddenUserIds: { $in: [userId] } },
                    { visibleUserIds: { $in: [userId] } }
                ]
            }, {
                $pull: {
                    targetUserIds: userId,
                    hiddenUserIds: userId,
                    visibleUserIds: userId
                }
            });
        }
        //  else if (this.db === 'sqldb') {
        //     await this.sqlRuleDataServer.delete({ where: { data: userId } });
        // } else if (this.db === 'dmdb') {
        //     await this.dmRuleDataServer.delete({ where: { data: userId } });
        // }
        await this.deleteUnusedRules();
    }

    async removeDepartmentFromRule(departmentId: string) {
        if (this.db === 'mongodb') {
            await this.mongoServer.updateMany({
                $or: [
                    { targetDepartmentIds: { $elemMatch: { $eq: departmentId } } },
                    { hiddenDepartmentIds: { $elemMatch: { $eq: departmentId } } },
                    { visibleDepartmentIds: { $elemMatch: { $eq: departmentId } } }
                ]
            }, {
                $pull: {
                    targetDepartmentIds: departmentId,
                    hiddenDepartmentIds: departmentId,
                    visibleDepartmentIds: departmentId
                }
            });
        }
        // else if (this.db === 'sqldb') {
        //     await this.sqlRuleDataServer.delete({ where: { data: departmentId } });
        // } else if (this.db === 'dmdb') {
        //     await this.dmRuleDataServer.delete({ where: { data: departmentId } });
        // }
        await this.deleteUnusedRules();
    }

    private async deleteUnusedRules() {
        if (this.db === 'mongodb') {
            await this.mongoServer.removeMany({ targetUserIds: { $size: 0 }, targetDepartmentIds: { $size: 0 } });
            await this.mongoServer.removeMany({
                hiddenToAll: false,
                visibleToSelfOrg: false,
                hiddenUserIds: { $size: 0 },
                visibleUserIds: { $size: 0 },
                hiddenDepartmentIds: { $size: 0 },
                visibleDepartmentIds: { $size: 0 }
            });
        }
        // else if (this.db === 'sqldb') {
        //     const rules = await this.sqlRuleServer.find();
        //     const ruleDatas = await this.sqlRuleDataServer.find({ where: { ruleId: { [Op.in]: rules.map(a => a._id) } } });
        //     const data = this.formatRuleDataForSql(rules, ruleDatas);
        //     const deleteIds: Array<string> = [];

        //     data.filter(a => a.targetUserIds.length === 0 && a.targetDepartmentIds.length === 0).map(a => deleteIds.push(a._id));
        //     data.filter(a =>
        //         a.hiddenToAll === false &&
        //         a.visibleToSelfOrg === false &&
        //         a.hiddenUserIds.length === 0 &&
        //         a.visibleUserIds.length === 0 &&
        //         a.hiddenDepartmentIds.length === 0 &&
        //         a.visibleDepartmentIds.length === 0
        //     ).map(a => deleteIds.push(a._id));

        //     if (deleteIds.length > 0) {
        //         await this.sqlRuleServer.delete({ where: { _id: { [Op.in]: deleteIds } } });
        //         await this.sqlRuleDataServer.delete({ where: { ruleId: { [Op.in]: deleteIds } } });
        //     }
        // } else if (this.db === 'dmdb') {
        //     const rules = await this.dmRuleServer.find({});
        //     const ruleDatas = await this.dmRuleDataServer.find({ where: { ruleId: { $in: rules.map(a => a._id) } } });
        //     const data = this.formatRuleDataForSql(rules, ruleDatas);
        //     const deleteIds: Array<string> = [];

        //     data.filter(a => a.targetUserIds.length === 0 && a.targetDepartmentIds.length === 0).map(a => deleteIds.push(a._id));
        //     data.filter(a =>
        //         a.hiddenToAll === false &&
        //         a.visibleToSelfOrg === false &&
        //         a.hiddenUserIds.length === 0 &&
        //         a.visibleUserIds.length === 0 &&
        //         a.hiddenDepartmentIds.length === 0 &&
        //         a.visibleDepartmentIds.length === 0
        //     ).map(a => deleteIds.push(a._id));

        //     if (deleteIds.length > 0) {
        //         await this.dmRuleServer.delete({ where: { _id: { $in: deleteIds } } });
        //         await this.dmRuleDataServer.delete({ where: { ruleId: { $in: deleteIds } } });
        //     }
        // }
    }

    async removeById(_id: string) {
        if (this.db === 'mongodb') {
            await this.mongoServer.removeOne({ _id });
        }
        // else if (this.db === 'sqldb') {
        //     await this.sqlRuleServer.delete({ where: { _id } });
        //     await this.sqlRuleDataServer.delete({ where: { ruleId: _id } });
        // } else if (this.db === 'dmdb') {
        //     await this.dmRuleServer.delete({ where: { _id } });
        //     await this.dmRuleDataServer.delete({ where: { ruleId: _id } });
        // }
    }

    async findById(id: string): Promise<AddressbookRuleModel | null> {
        if (this.db === 'mongodb') {
            return await this.mongoServer.findById(id);
        }
        // else if (this.db === 'sqldb') {
        //     const rule = await this.sqlRuleServer.findById(id);

        //     if (rule) {
        //         const ruleData = await this.sqlRuleDataServer.find({ where: { ruleId: id } });

        //         return this.formatRuleDataForSql([rule], ruleData)[0];
        //     }
        // } else if (this.db === 'dmdb') {
        //     const rule = await this.dmRuleServer.findOne({ where: { _id: id } });

        //     if (rule) {
        //         const ruleData = await this.dmRuleDataServer.find({ where: { ruleId: id } });

        //         return this.formatRuleDataForSql([rule], ruleData)[0];
        //     }
        // }

        return null;
    }

    async updateById(_id: string, update: {
        name?: string
        hiddenToAll?: boolean
        visibleToSelfOrg?: boolean
        targetUserIds?: Array<string>
        targetDepartmentIds?: Array<string>
        hiddenUserIds?: Array<string>
        visibleUserIds?: Array<string>
        hiddenDepartmentIds?: Array<string>
        visibleDepartmentIds?: Array<string>
    }): Promise<void> {
        // const { name, hiddenToAll, visibleToSelfOrg, targetUserIds, targetDepartmentIds, hiddenUserIds, visibleUserIds, hiddenDepartmentIds, visibleDepartmentIds } = update;

        if (this.db === 'mongodb') {
            await this.mongoServer.updateOne({ _id }, { $set: update });
        }
        // else if (this.db === 'sqldb' || this.db === 'dmdb') {
        //     if (this.db === 'sqldb') {
        //         await this.sqlRuleServer.update({ where: { _id } }, { name, hiddenToAll: hiddenToAll === true ? 1 : 0, visibleToSelfOrg: visibleToSelfOrg === true ? 1 : 0 });
        //         await this.sqlRuleDataServer.delete({ where: { ruleId: _id } });
        //     } else {
        //         await this.dmRuleServer.update({ where: { _id } }, { name, hiddenToAll: hiddenToAll === true ? 1 : 0, visibleToSelfOrg: visibleToSelfOrg === true ? 1 : 0 });
        //         await this.dmRuleDataServer.delete({ where: { ruleId: _id } });
        //     }
        //     const insertData: Array<SqlAddressBookRuleDataModel> = [];

        //     targetUserIds?.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId: _id,
        //             data: a,
        //             type: 1
        //         });
        //     });
        //     targetDepartmentIds?.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId: _id,
        //             data: a,
        //             type: 2
        //         });
        //     });
        //     hiddenUserIds?.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId: _id,
        //             data: a,
        //             type: 3
        //         });
        //     });
        //     visibleUserIds?.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId: _id,
        //             data: a,
        //             type: 4
        //         });
        //     });
        //     hiddenDepartmentIds?.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId: _id,
        //             data: a,
        //             type: 5
        //         });
        //     });
        //     visibleDepartmentIds?.map(a => {
        //         insertData.push({
        //             _id: this.sqlRuleServer.randomId,
        //             ruleId: _id,
        //             data: a,
        //             type: 6
        //         });
        //     });

        //     if (this.db === 'sqldb') {
        //         await this.sqlRuleDataServer.insertMany(insertData);
        //     } else {
        //         for (let s = 0; s < insertData.length; s++) {
        //             await this.dmRuleDataServer.insert(insertData[s]);
        //         }
        //     }
        // }
    }

    async paging(option: { name?: string }, skip: number, limit: number): Promise<{ list: Array<AddressbookRuleModel>, total: number }> {
        if (this.db === 'mongodb') {
            return await this.mongoServer.paging(Object.keys(option).length > 0 ? option : {}, limit, skip, {});
        }
        // else if (this.db === 'sqldb') {
        //     const rulesPage = await this.sqlRuleServer.paging({ where: option, offset: skip, limit });
        //     const ruleDatas = await this.sqlRuleDataServer.find({ where: { ruleId: { [Op.in]: rulesPage.list.map(a => a._id) } } });

        //     return {
        //         list: this.formatRuleDataForSql(rulesPage.list, ruleDatas),
        //         total: rulesPage.total
        //     };
        // } else if (this.db === 'dmdb') {
        //     const rulesPage = await this.dmRuleServer.paging({ where: option }, { skip, limit });
        //     const ruleDatas = await this.dmRuleDataServer.find({ where: { ruleId: { $in: rulesPage.list.map(a => a._id) } } });

        //     return {
        //         list: this.formatRuleDataForSql(rulesPage.list, ruleDatas),
        //         total: rulesPage.total
        //     };
        // }
        return {
            list: [],
            total: 0
        };
    }

    async count(option?: { name: string }): Promise<number> {
        if (this.db === 'mongodb') {
            return await this.mongoServer.count(option);
        }
        // else if (this.db === 'sqldb') {
        //     return await this.sqlRuleServer.count({ where: option });
        // } else if (this.db === 'dmdb') {
        //     return await this.dmRuleServer.count({ where: option });
        // }

        return 0;
    }

    async getHiddenToAllRules(): Promise<Array<AddressbookRuleModel>> {
        if (this.db === 'mongodb') {
            return await this.mongoServer.find({ hiddenToAll: true, visibleToSelfOrg: false });
        }
        // else if (this.db === 'sqldb') {
        //     const rules = await this.sqlRuleServer.find({ where: { hiddenToAll: 1, visibleToSelfOrg: 0 } });
        //     const ruleDatas = await this.sqlRuleDataServer.find({ where: { ruleId: { [Op.in]: rules.map(a => a._id) } } });

        //     return this.formatRuleDataForSql(rules, ruleDatas);
        // } else if (this.db === 'dmdb') {
        //     const rules = await this.dmRuleServer.find({ where: { hiddenToAll: 1, visibleToSelfOrg: 0 } });
        //     const ruleDatas = await this.dmRuleDataServer.find({ where: { ruleId: { $in: rules.map(a => a._id) } } });

        //     return this.formatRuleDataForSql(rules, ruleDatas);
        // }
        return [];
    }

    async getHiddenToUserRules(userId: string, userDepartmentPathArr: Array<string>): Promise<Array<AddressbookRuleModel>> {
        if (this.db === 'mongodb') {
            return await this.mongoServer.find({
                hiddenToAll: false,
                visibleToSelfOrg: false,
                $or: [
                    { hiddenUserIds: { $in: [userId] } },
                    ...userDepartmentPathArr.length > 0 ? [{ hiddenDepartmentIds: { $in: userDepartmentPathArr } }] : []
                ]
            });
        }
        // else if (this.db === 'sqldb') {
        //     const rules = await this.sqlRuleServer.find({ where: { hiddenToAll: 0, visibleToSelfOrg: 0 } });
        //     const ruleDatas = await this.sqlRuleDataServer.find({
        //         where: {
        //             ruleId: { [Op.in]: rules.map(a => a._id) },
        //             [Op.or]: [{
        //                 type: 3,
        //                 data: userId
        //             }, {
        //                 type: 5,
        //                 data: { [Op.in]: userDepartmentPathArr }
        //             }]
        //         }
        //     });
        //     const ruleIds: Set<string> = new Set(ruleDatas.map(a => a.ruleId));

        //     return this.formatRuleDataForSql(rules.filter(a => ruleIds.has(a._id)), ruleDatas);
        // } else if (this.db === 'dmdb') {
        //     const rules = await this.dmRuleServer.find({ where: { hiddenToAll: 0, visibleToSelfOrg: 0 } });
        //     const ruleDatas = await this.dmRuleDataServer.find({
        //         where: {
        //             ruleId: { $in: rules.map(a => a._id) },
        //             $or: [{
        //                 type: 3,
        //                 data: userId
        //             }, {
        //                 type: 5,
        //                 data: { $in: userDepartmentPathArr }
        //             }]
        //         }
        //     });
        //     const ruleIds: Set<string> = new Set(ruleDatas.map(a => a.ruleId));

        //     return this.formatRuleDataForSql(rules.filter(a => ruleIds.has(a._id)), ruleDatas);
        // }
        return [];
    }

    async getWhiteListWithoutUserRules(userId: string, userDepartmentPathArr: Array<string>): Promise<Array<AddressbookRuleModel>> {
        if (this.db === 'mongodb') {
            return await this.mongoServer.find({
                hiddenToAll: false,
                visibleToSelfOrg: false,
                $or: [
                    { visibleUserIds: { $not: { $size: 0 } } },
                    { visibleDepartmentIds: { $not: { $size: 0 } } }
                ],
                visibleUserIds: { $nin: [userId] },
                ...userDepartmentPathArr.length > 0 ? { visibleDepartmentIds: { $nin: userDepartmentPathArr } } : {}
            });
        }
        // else if (this.db === 'sqldb' || this.db === 'dmdb') {
        //     const rules = this.db === 'sqldb' ?
        //         await this.sqlRuleServer.find({ where: { hiddenToAll: 0, visibleToSelfOrg: 0 } }) :
        //         await this.dmRuleServer.find({ where: { hiddenToAll: 0, visibleToSelfOrg: 0 } });
        //     const ruleDatas = this.db === 'sqldb' ?
        //         await this.sqlRuleDataServer.find({ where: { ruleId: { [Op.in]: rules.map(a => a._id) } } }) :
        //         await this.dmRuleDataServer.find({ where: { ruleId: { $in: rules.map(a => a._id) } } });
        //     const data = this.formatRuleDataForSql(rules, ruleDatas);

        //     return data.filter(a => {
        //         if (a.visibleUserIds.length === 0 && a.visibleDepartmentIds.length === 0) {
        //             return false;
        //         } else {
        //             if (a.visibleUserIds.length > 0 && !a.visibleUserIds.includes(userId)) {
        //                 return true;
        //             }
        //             if (a.visibleDepartmentIds.length > 0 && userDepartmentPathArr.length > 0) {
        //                 let mark = true;

        //                 for (let s = 0; s < a.visibleDepartmentIds.length; s++) {
        //                     if (userDepartmentPathArr.includes(a.visibleDepartmentIds[s])) {
        //                         mark = false;
        //                     }
        //                 }
        //                 return mark;
        //             }
        //         }
        //         return false;
        //     });
        // }
        return [];
    }

    async checkUserHasScanSelfOrgRules(userId: string, userDepartmentPathArr: Array<string>): Promise<Array<AddressbookRuleModel>> {
        if (this.db === 'mongodb') {
            return await this.mongoServer.find({
                hiddenToAll: false,
                visibleToSelfOrg: true,
                $or: [
                    { targetUserIds: { $in: [userId] } },
                    ...userDepartmentPathArr.length > 0 ? [{ targetDepartmentIds: { $in: userDepartmentPathArr } }] : []
                ]
            });
        }
        //  else if (this.db === 'sqldb' || this.db === 'dmdb') {
        //     const rules = this.db === 'sqldb' ?
        //         await this.sqlRuleServer.find({ where: { hiddenToAll: 0, visibleToSelfOrg: 1 } }) :
        //         await this.dmRuleServer.find({ where: { hiddenToAll: 0, visibleToSelfOrg: 1 } });
        //     const ruleDatas = this.db === 'sqldb' ?
        //         await this.sqlRuleDataServer.find({ where: { ruleId: { [Op.in]: rules.map(a => a._id) } } }) :
        //         await this.dmRuleDataServer.find({ where: { ruleId: { $in: rules.map(a => a._id) } } });
        //     const data = this.formatRuleDataForSql(rules, ruleDatas);

        //     return data.filter(a => {
        //         if (a.targetUserIds.length > 0 && a.targetUserIds.includes(userId)) {
        //             return true;
        //         }
        //         if (a.targetDepartmentIds.length > 0 && userDepartmentPathArr.length > 0) {
        //             for (let s = 0; s < a.targetDepartmentIds.length; s++) {
        //                 if (userDepartmentPathArr.includes(a.targetDepartmentIds[s])) {
        //                     return true;
        //                 }
        //             }
        //         }

        //         return false;
        //     });
        // }
        return [];
    }
}
