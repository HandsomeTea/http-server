import { ModelAttributes, ModelStatic, Model, ModelOptions, CreateOptions, FindOptions, Identifier, FindAndCountOptions, DestroyOptions, UpdateOptions, UpsertOptions, CreationAttributes, QueryTypes, CountOptions, BulkCreateOptions } from 'sequelize';
import { Types } from 'mongoose';
import SQL from '@/tools/sql';

export default class SQLBase<TM>{
    protected tableName: string;
    private model: ModelStatic<Model<TM>> | undefined;
    private modelIsSync: boolean;
    protected tenantId!: string | undefined;
    constructor(tableName: string, tableStruct: ModelAttributes<Model<TM>>, tenantId?: string, option?: ModelOptions) {
        this.tenantId = tenantId;
        this.tableName = this.tenantId ? `${this.tenantId}_${tableName}` : tableName;
        this.model = SQL.server?.define(this.tableName, tableStruct, {
            ...option,
            createdAt: true,
            updatedAt: true,
            omitNull: true,
            freezeTableName: true //默认会给表名加s
        });
        this.modelIsSync = false;
    }

    private async getModelInstance(): Promise<ModelStatic<Model<TM>> | undefined> {
        if (global.tenantDBModel[this.tableName]) {
            return global.tenantDBModel[this.tableName].data;
        }
        if (!this.modelIsSync) {
            await this.model?.sync(); //相当于 CREATE TABLE IF NOT EXISTS ...
            this.modelIsSync = true;
        }
        if (!this.tenantId) {
            return this.model;
        }
        global.tenantDBModel[this.tableName] = {
            data: this.model,
            timer: setTimeout(() => {
                clearTimeout(global.tenantDBModel[this.tableName].timer);
                delete global.tenantDBModel[this.tableName];
            }, 30 * 60 * 1000)
        };
        return global.tenantDBModel[this.tableName].data;
    }

    /**
     * 生成一个可以作为primaryKey的随机字符串
     * @readonly
     * @memberof SqlBase
     */
    public get randomId() {
        return new Types.ObjectId().toString();
    }

    public async tableIsExist(tableName?: string) {
        const databaseName = SQL.server?.getDatabaseName();
        const tableInfo = (await SQL.server?.showAllSchemas({}))?.find(a => a[`Tables_in_${databaseName}`] === tableName || this.tableName);

        return tableInfo ? true : false;
    }

    public async insert(data: CreationAttributes<Model<TM>>, option?: CreateOptions<TM>): Promise<TM> {
        return await (await this.getModelInstance())?.create(data, option) as unknown as TM;
    }

    public async insertMany(data: Array<CreationAttributes<Model<TM>>>, option?: BulkCreateOptions<TM>): Promise<Array<TM>> {
        return await (await this.getModelInstance())?.bulkCreate(data, option) as unknown as Array<TM>;
    }

    public async delete(option: DestroyOptions<TM>) {
        return await (await this.getModelInstance())?.destroy(option);
    }

    public async update(query: UpdateOptions<TM>, set: { [key in keyof TM]?: TM[key] }) {
        return await (await this.getModelInstance())?.update(set, query);
    }

    public async upsert(set: CreationAttributes<Model<TM>>, option?: UpsertOptions<TM>): Promise<[TM, boolean | null]> {
        return await (await this.getModelInstance())?.upsert(set, option) as unknown as [TM, boolean | null];
    }

    public async find(query?: FindOptions<TM>) {
        return await (await this.getModelInstance())?.findAll(query) as unknown as Array<TM>;
    }

    public async findOne(query: FindOptions<TM>) {
        return await (await this.getModelInstance())?.findOne(query) as TM | null;
    }

    public async findById(id: Identifier, option?: FindOptions<TM>) {
        if (id) {
            return await (await this.getModelInstance())?.findByPk(id, option) as TM | null;
        }
        return null;
    }

    public async paging(query: FindAndCountOptions<TM>) {
        const pageResult = await (await this.getModelInstance())?.findAndCountAll(query);

        return { list: (pageResult?.rows || []) as unknown as Array<TM>, total: pageResult?.count || 0 };
    }

    public async count(query?: Omit<CountOptions<TM>, 'group'>): Promise<number> {
        return await (await this.getModelInstance())?.count(query) || 0;
    }

    /**
     * @param {string} sql 如: insert into test (id, user_id, type, create_at, updated_at) values ('test123', 'aaaaaa', 'ws', '2022-4-13 21:10:12', '2022-4-13 21:10:12');
     * @returns {Promise<[number, number]>}
     * @memberof SqlBase
     */
    public async insertExecute(sql: string): Promise<[number, number]> {
        return await SQL.server?.query(sql, { type: QueryTypes.INSERT }) as [number, number];
    }

    /**
     * @param {string} sql 如: delete from test where type='ws';
     * @returns {Promise<undefined>}
     * @memberof SqlBase
     */
    public async deleteExecute(sql: string): Promise<undefined> {
        return await SQL.server?.query(sql, { type: QueryTypes.DELETE }) as undefined;
    }

    /**
     * 注意: where条件必须在set条件之后
     * @param {string} sql 如: update test set user_id='asdasdasd1234' where id='sad23asd345dfg';
     * @returns {Promise<[null, number]>}
     * @memberof SqlBase
     */
    public async updateExecute(sql: string): Promise<[null, number]> {
        return await SQL.server?.query(sql, { type: QueryTypes.UPDATE }) as unknown as [null, number];
    }

    /**
     * update的是: duplicate key 后面的数据
     * @param {string} sql 如: insert into test (id, user_id, type, create_at, updated_at) values ('test12345ss', 'sssaa', 'ws', '2022-4-13 21:10:12', '2022-4-13 21:10:12') on duplicate key update id='test12345ss1', user_id='sssaa1';
     * @returns {Promise<[number, boolean]>} [0, true]代表insert，[0, false]代表update
     * @memberof SqlBase
     */
    public async upsertExecute(sql: string): Promise<[number, boolean]> {
        return await SQL.server?.query(sql, { type: QueryTypes.UPSERT }) as unknown as [number, boolean];
    }

    /**
     * @param {string} sql 如: select * from test;
     * @returns {Promise<Array<TM>>}
     * @memberof SqlBase
     */
    public async selectExecute(sql: string): Promise<Array<TM>> {
        return await SQL.server?.query(sql, { type: QueryTypes.SELECT }) as unknown as Array<TM>;
    }
}
