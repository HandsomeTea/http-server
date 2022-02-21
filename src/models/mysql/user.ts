import { ModelAttributes, Model, DataTypes } from 'sequelize';

import Base from './base';

export default class User extends Base<UserModel> {
    constructor(tenantId: string) {
        const model: ModelAttributes<Model<UserModel>> = {
            _id: {
                type: DataTypes.INTEGER,
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
        };

        super(`users_${tenantId}`, model, {
            omitNull: true,
            indexes: [{
                unique: true,
                fields: ['name']
            }]
        });
    }
}
