/* eslint-disable camelcase */
import { DataTypes, Model, ModelAttributes } from 'sequelize';

import BaseDb from './base';

interface MysqlUserTokenModel {
	id: string
	user_id: string
	type: 'ws' | 'http' | 'device-ws'
	device_type?: 'BCD' | 'BCM' | 'BR' | 'H323_SIP' | 'PSTN'
	serial_number?: string
	createdAt?: Date
	updatedAt?: Date
}

export default class UserToken extends BaseDb<MysqlUserTokenModel> {
	constructor(tenantId: string) {
		const model: ModelAttributes<Model<MysqlUserTokenModel>> = {
			id: {
				type: DataTypes.STRING,
				unique: true,
				primaryKey: true,
				comment: 'id即为hashedToken'
			},
			user_id: {
				type: DataTypes.STRING
			},
			type: {
				type: DataTypes.STRING
			},
			device_type: {
				type: DataTypes.STRING,
				get() {
					return this.getDataValue('device_type') || 'default device_type';
				}
			},
			serial_number: {
				type: DataTypes.STRING
			}
		};

		super('user_token', model, tenantId);
	}
}
