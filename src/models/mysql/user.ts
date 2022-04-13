import { DataTypes } from 'sequelize';

import Base from './base';

export default class User extends Base<UserModel> {
    constructor(tenantId: string) {
        super('users', {
            _id: {
                type: DataTypes.STRING,
                primaryKey: true,
                unique: true,
                comment: '唯一性标志'
            },
            name: {
                type: DataTypes.STRING
            },
            test: {
                type: DataTypes.STRING
            }
        }, tenantId, {
            omitNull: true,
            indexes: [{
                unique: true,
                fields: ['name']
            }]
        });
    }
}
