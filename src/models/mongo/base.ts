import { Types, SchemaDefinition, FilterQuery, UpdateQuery, QueryOptions, UpdateWithAggregationPipeline, SchemaDefinitionType, Model, AnyKeys, Aggregate } from 'mongoose';
import mongodb from '@/tools/mongodb';

/**
 * 关于collection的删除
 * 如果collection不存在，直接删除mongoose会抛错，需要判断这个collection的存在性，或者使用try-catch处理
 * 如果一个collection有索引，删除这个collection时要删除其Model，不然删不掉，如：
 *      await db.dropCollection(`${tenantId}_users`);
 *      await db.deleteModel(`${tenantId}_users`);
 */
export default class MongoBase<CM>{
    private collectionName: string;
    private schemaModel: SchemaDefinition<SchemaDefinitionType<CM>>;
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
     * @param {SchemaDefinition<SchemaDefinitionType<CM>>} model mongodb的集合(表)结构
     * @param {({
     *             [key: string]: {
     *                 background?: boolean
     *                 expires?: number | string
     *                 sparse?: boolean
     *                 type?: string
     *                 unique?: boolean
     *             }
     *         })} [_index] mongodb的集合(表)索引
     * @memberof BaseDb
     */
    constructor(collectionName: string, model: SchemaDefinition<SchemaDefinitionType<CM>>,
        _index?: {
            [key: string]: {
                background?: boolean
                expires?: number | string
                sparse?: boolean
                type?: string
                unique?: boolean
            }
        }) {
        this.collectionName = collectionName;
        this.schemaModel = model;
        this.index = _index;
    }

    private get model(): Model<CM> {
        const _schema = new mongodb.schema(this.schemaModel, { _id: false, versionKey: false, timestamps: { createdAt: true, updatedAt: '_updatedAt' } });

        if (this.index) {
            for (const key in this.index) {
                _schema.index({ [key]: 1 }, this.index[key]);
            }
        }

        return mongodb.server.model(this.collectionName, _schema, this.collectionName);
    }

    private id(data: AnyKeys<CM> | Array<AnyKeys<CM>>): Array<AnyKeys<CM & { _id: string }>> {
        const result: Array<AnyKeys<CM & { _id: string }>> = [];

        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
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

    async collectionExist(collectionName?: string) {
        const allCollections = (await mongodb.server.db?.collections())?.map(a => a.collectionName);

        return Boolean(allCollections?.find(colName => colName === (collectionName || this.collectionName)));
        // if (await Users.collectionExist(`${tenantId}_users`)) {
        //     await mongodb.server.collection(`${tenantId}_users`).dropIndexes();
        //     await mongodb.server.dropCollection(`${tenantId}_users`);
        //     await mongodb.server.deleteModel(`${tenantId}_users`);
        //     devLogger(`tenant:${tenantId}-deleted-user-collection`).info(`collection ${tenantId}_users droped for tenant deletion.`);
        // }
    }

    // async create(data: CM | Array<CM>): Promise<CM | Array<CM>> {
    //     if (Array.isArray(data)) {
    //         return await this.model.insertMany(this.id(data));
    //     } else {
    //         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //         // @ts-ignore
    //         return await new this.model(this.id(data)[0]).save();
    //     }
    // }

    async insertOne(data: CM): Promise<CM> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return await new this.model(this.id(data)[0]).save();
    }

    async insertMany(data: Array<CM>): Promise<Array<CM>> {
        return await this.model.insertMany(data.map(a => this.id(a)));
    }

    async removeOne(query: FilterQuery<CM>): Promise<{ deletedCount: number }> {
        if (await this.collectionExist()) {
            return await this.model.deleteOne(query);
        }
        return { deletedCount: 0 };
    }

    async removeMany(query: FilterQuery<CM>): Promise<{ deletedCount: number }> {
        if (await this.collectionExist()) {
            return await this.model.deleteMany(query);
        }
        return { deletedCount: 0 };
    }

    async updateOne(query: FilterQuery<CM>, update: UpdateQuery<CM> | UpdateWithAggregationPipeline, options?: QueryOptions): Promise<{
        acknowledged: boolean
        modifiedCount: number
        upsertedId: null | string
        upsertedCount: number
        matchedCount: number
    }> {
        if (await this.collectionExist()) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return await this.model.updateOne(query, update, options);
        }
        return {
            acknowledged: false,
            modifiedCount: 0,
            upsertedId: null,
            upsertedCount: 0,
            matchedCount: 0
        };
    }

    /**upsert尽量不要触发insert，否则会生成一个ObjectId构建的_id，除非指定一个_id，并且collection里面的default默认设置的字段也不会有 */
    async upsertOne(query: FilterQuery<CM>, update: UpdateQuery<CM> | UpdateWithAggregationPipeline, options?: QueryOptions) {
        return await this.updateOne(query, update, { ...options, upsert: true });
    }

    async updateMany(query: FilterQuery<CM>, update: UpdateQuery<CM> | UpdateWithAggregationPipeline, options?: QueryOptions): Promise<{
        acknowledged: boolean
        modifiedCount: number
        upsertedId: null | string
        upsertedCount: number
        matchedCount: number
    }> {
        if (await this.collectionExist()) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return await this.model.updateMany(query, update, options);
        }
        return {
            acknowledged: false,
            modifiedCount: 0,
            upsertedId: null,
            upsertedCount: 0,
            matchedCount: 0
        };
    }

    /**upsert尽量不要触发insert，否则会生成一个ObjectId构建的_id，除非指定_id，并且collection里面的default默认设置的字段也不会有 */
    async upsertMany(query: FilterQuery<CM>, update: UpdateQuery<CM> | UpdateWithAggregationPipeline, options?: QueryOptions) {
        return await this.updateMany(query, update, { ...options, upsert: true });
    }

    async find(query?: FilterQuery<CM>, options?: QueryOptions) {
        if (await this.collectionExist()) {
            return await this.model.find(query || {}, null, options).lean();
        }
        return [];
    }

    async findOne(query: FilterQuery<CM>, options?: QueryOptions) {
        if (await this.collectionExist()) {
            return await this.model.findOne(query, null, options).lean();
        }
        return null;
    }

    async findById(_id: string, options?: QueryOptions) {
        if (await this.collectionExist()) {
            return await this.model.findById(_id, null, options).lean();
        }
        return null;
    }

    async paging(query: FilterQuery<CM>, limit: number, skip: number, sort?: Record<string, 'asc' | 'desc' | 'ascending' | 'descending' | '1' | '-1'>, options?: QueryOptions) {
        if (await this.collectionExist()) {
            return await this.model.find(query, null, options).sort(sort).skip(skip || 0).limit(limit).lean();
        }
        return [];
    }

    async count(query?: FilterQuery<CM>): Promise<number> {
        if (!await this.collectionExist()) {
            return 0;
        }
        if (query) {
            return await this.model.countDocuments(query);
        } else {
            return await this.model.estimatedDocumentCount();
        }
    }

    // get aggregate() {
    //     return this.model.aggregate;
    // }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async aggregate(aggregations: Array<any>): Promise<Aggregate<Array<any>>> {
        if (!await this.collectionExist()) {
            return [];
        }
        return await this.model.aggregate(aggregations);
    }
}