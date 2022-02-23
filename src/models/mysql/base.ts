import { ModelAttributes, ModelCtor, Model, ModelOptions, CreateOptions, FindOptions, Identifier, FindAndCountOptions, DestroyOptions, UpdateOptions, UpsertOptions } from 'sequelize';
import MySQL from '@/tools/mysql';

export default class SqlBase<TM>{
    public tableName: string;
    private model: ModelCtor<Model<TM>>;
    private modelIsSync: boolean;
    constructor(tableName: string, tableStruct: ModelAttributes<Model<TM>>, option?: ModelOptions) {
        this.tableName = tableName;
        this.model = MySQL.server.define(this.tableName, tableStruct, {
            ...option,
            createdAt: true,
            updatedAt: '_updatedAt',
            freezeTableName: true //默认会给表名加s
        });
        this.modelIsSync = false;
    }

    private async getModelInstance() {
        if (!this.modelIsSync) {
            await this.model.sync(); //相当于 CREATE TABLE IF NOT EXISTS ...
            this.modelIsSync = true;
        }

        return this.model;
    }

    public async insert(data: TM, option?: CreateOptions): Promise<TM> {
        return await (await this.getModelInstance()).create(data, option) as unknown as TM;
    }

    public async delete(option: DestroyOptions<TM>) {
        return await (await this.getModelInstance()).destroy(option);
    }

    public async update(query: UpdateOptions<TM>, set: { [key in keyof TM]?: TM[key] }) {
        return await (await this.getModelInstance()).update(set, query);
    }

    public async upsert(set: TM, option?: UpsertOptions<TM>): Promise<[TM, boolean | null]> {
        return await (await this.getModelInstance()).upsert(set, option) as unknown as [TM, boolean | null];
    }

    public async find(query?: FindOptions<TM>) {
        return await (await this.getModelInstance()).findAll(query) as unknown as Array<TM>;
    }

    public async findOne(query: FindOptions<TM>) {
        return await (await this.getModelInstance()).findOne(query) as TM | null;
    }

    public async findById(id: Identifier, option?: FindOptions<TM>) {
        if (id) {
            return await (await this.getModelInstance()).findByPk(id, option) as TM | null;
        }
        return null;
    }

    public async paging(query: FindAndCountOptions<TM>) {
        const { count, rows } = await (await this.getModelInstance()).findAndCountAll(query);

        return { count, data: rows as unknown as Array<TM> };
    }
}
