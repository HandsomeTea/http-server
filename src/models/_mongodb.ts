import { Types, SchemaDefinition, Model, FilterQuery, UpdateQuery, QueryOptions, UpdateWithAggregationPipeline, SchemaOptions } from 'mongoose';
import mongodb from '@/tools/mongodb';

/**
 * 关于collection的删除
 * 如果collection不存在，直接删除mongoose会抛错，需要判断这个collection的存在性，或者使用try-catch处理
 * 如果一个collection有索引，删除这个collection时要删除其Model，不然删不掉，如：
 *      await db.dropCollection(`${tenantId}_users`);
 *      await db.deleteModel(`${tenantId}_users`);
 */
export default class BaseDb {
    private tenantId: string | undefined;
    private collectionName: string;
    private schemaModel: SchemaDefinition<DBModel>;
    private index: {
        [key: string]: {
            background?: boolean
            expires?: number | string
            sparse?: boolean
            type?: string
            unique?: boolean
        }
    } | undefined;

    /**
     * Creates an instance of BaseDb.
     * @param {string} collectionName mongodb的集合(表)名称，如果分租户，则不应该包含租户tenantId
     * @param {SchemaDefinition<DBModel>} model mongodb的集合(表)结构
     * @param {({
     *             [key: string]: {
     *                 background?: boolean
     *                 expires?: number | string
     *                 sparse?: boolean
     *                 type?: string
     *                 unique?: boolean
     *             }
     *         })} [_index] mongodb的集合(表)索引
     * @param {string} [_tenantId] mongodb的集合(表)如果分租户，则表示该集合(表)属于哪个tenantId(集合/表的前缀)
     * @memberof BaseDb
     */
    constructor(collectionName: string, model: SchemaDefinition<DBModel>,
        _index?: {
            [key: string]: {
                background?: boolean
                expires?: number | string
                sparse?: boolean
                type?: string
                unique?: boolean
            }
        },
        _tenantId?: string) {
        this.tenantId = _tenantId;
        this.collectionName = collectionName + (this.tenantId ? `_${this.tenantId}` : '');
        this.schemaModel = model;
        this.index = _index;
    }

    get model(): Model<DBModel> {
        const _schema = new mongodb.schema<DBModel>(this.schemaModel, { _id: false, versionKey: false, timestamps: { createdAt: true, updatedAt: '_updatedAt' } } as SchemaOptions);

        if (this.index) {
            for (const key in this.index) {
                _schema.index({ [key]: 1 }, this.index[key]);
            }
        }

        return mongodb.server.model(this.collectionName, _schema, this.collectionName);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _id(data: { [key: string]: any } | Array<{ [key: string]: any }>): Array<{ [key: string]: any }> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: Array<{ [key: string]: any }> = [];

        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                if (typeof data[i]._id !== 'string' || typeof data[i]._id === 'string' && data[i]._id?.trim() === '') {
                    result.push({
                        ...data[i],
                        _id: new Types.ObjectId().toString()
                    });
                }
            }
        } else {
            result.push({
                ...data,
                _id: new Types.ObjectId().toString()
            });
        }

        return result;
    }

    async create(data: DBModel | Array<DBModel>): Promise<DBModel | Array<DBModel>> {
        if (Array.isArray(data)) {
            return await this.model.insertMany(this._id(data));
        } else {
            return await new this.model(this._id(data)[0]).save();
        }
    }

    async removeOne(query: FilterQuery<DBModel>): Promise<{ deletedCount: number }> {
        return await this.model.deleteOne(query);
    }

    async removeMany(query: FilterQuery<DBModel>): Promise<{ deletedCount: number }> {
        return await this.model.deleteMany(query);
    }

    async updateOne(query: FilterQuery<DBModel>, update: UpdateQuery<DBModel> | UpdateWithAggregationPipeline, options?: QueryOptions): Promise<{
        acknowledged: boolean
        modifiedCount: number
        upsertedId: null | string
        upsertedCount: number
        matchedCount: number
    }> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return await this.model.updateOne(query, update, options);
    }

    /**upsert尽量不要触发insert，否则会生成一个ObjectId构建的_id，除非指定一个_id，并且collection里面的default默认设置的字段也不会有 */
    async upsertOne(query: FilterQuery<DBModel>, update: UpdateQuery<DBModel> | UpdateWithAggregationPipeline, options?: QueryOptions): Promise<{
        acknowledged: boolean
        modifiedCount: number
        upsertedId: null | string
        upsertedCount: number
        matchedCount: number
    }> {
        return await this.updateOne(query, update, { ...options, upsert: true });
    }

    async updateMany(query: FilterQuery<DBModel>, update: UpdateQuery<DBModel> | UpdateWithAggregationPipeline, options?: QueryOptions): Promise<{
        acknowledged: boolean
        modifiedCount: number
        upsertedId: null | string
        upsertedCount: number
        matchedCount: number
    }> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return await this.model.updateMany(query, update, options);
    }

    /**upsert尽量不要触发insert，否则会生成一个ObjectId构建的_id，除非指定_id，并且collection里面的default默认设置的字段也不会有 */
    async upsertMany(query: FilterQuery<DBModel>, update: UpdateQuery<DBModel> | UpdateWithAggregationPipeline, options?: QueryOptions): Promise<{
        acknowledged: boolean
        modifiedCount: number
        upsertedId: null | string
        upsertedCount: number
        matchedCount: number
    }> {
        return await this.updateMany(query, update, { ...options, upsert: true });
    }

    async find(query?: FilterQuery<DBModel>, options?: QueryOptions): Promise<Array<DBModel>> {
        return await this.model.find(query || {}, null, options).lean();
    }

    async findOne(query: FilterQuery<DBModel>, options?: QueryOptions): Promise<DBModel | null> {
        return await this.model.findOne(query, null, options).lean();
    }

    async findById(_id: string, options?: QueryOptions): Promise<DBModel | null> {
        return await this.model.findById(_id, null, options).lean();
    }

    async paging(query: FilterQuery<DBModel>, limit: number, skip: number, sort?: Record<string, 'asc' | 'desc' | 'ascending' | 'descending' | '1' | '-1'>, options?: QueryOptions): Promise<Array<DBModel>> {
        return await this.model.find(query, null, options).sort(sort).skip(skip || 0).limit(limit).lean();
    }

    async count(query?: FilterQuery<DBModel>): Promise<number> {
        if (query) {
            return await this.model.countDocuments(query);
        } else {
            return await this.model.estimatedDocumentCount();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async aggregate(aggregations: Array<any>): Promise<Array<any>> {
        return await this.model.aggregate(aggregations);
    }
}
