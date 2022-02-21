import { FilterQuery, QueryOptions, UpdateQuery, UpdateWithAggregationPipeline } from 'mongoose';

import BaseDAL from './base';
import { _MongoUser } from '@/models/mongo';


export default class UserDAL extends BaseDAL {
    private tId!: string;
    private server: _MongoUser;

    constructor(tenantId: string) {
        super();
        this.tId = tenantId;
        this.server = new _MongoUser(this.tId);
    }

    async updateOne(query: FilterQuery<UserModel>, update: UpdateQuery<UserModel> | UpdateWithAggregationPipeline, options?: QueryOptions) {
        if (this.db === 'mongodb') {
            await this.server.updateOne(query, update, options);
        }
    }
}
