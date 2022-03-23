import { ModelAttributes, ModelStatic, Model, ModelOptions, CreateOptions, FindOptions, Identifier, FindAndCountOptions, DestroyOptions, UpdateOptions, UpsertOptions, CreationAttributes } from 'sequelize';
import MySQL from '@/tools/mysql';

export default class SqlBase<TM>{
    protected tableName: string;
    private model: ModelStatic<Model<TM>>;
    private modelIsSync: boolean;
    protected tenantId!: string | undefined;
    constructor(tableName: string, tableStruct: ModelAttributes<Model<TM>>, option?: ModelOptions, tenantId?: string) {
        this.tenantId = tenantId;
        this.tableName = this.tenantId ? `${this.tenantId}_${tableName}` : tableName;
        this.model = MySQL.server.define(this.tableName, tableStruct, {
            ...option,
            createdAt: true,
            updatedAt: '_updatedAt',
            freezeTableName: true //默认会给表名加s
        });
        this.modelIsSync = false;
    }

    private async getModelInstance(): Promise<ModelStatic<Model<TM>>> {
        if (global.tenantDBModel[this.tableName]) {
            return global.tenantDBModel[this.tableName].data;
        }
        if (!this.modelIsSync) {
            await this.model.sync(); //相当于 CREATE TABLE IF NOT EXISTS ...
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

    public async insert(data: CreationAttributes<Model<TM>>, option?: CreateOptions): Promise<TM> {
        return await (await this.getModelInstance()).create(data, option) as unknown as TM;
    }

    public async delete(option: DestroyOptions<TM>) {
        return await (await this.getModelInstance()).destroy(option);
    }

    public async update(query: UpdateOptions<TM>, set: { [key in keyof TM]?: TM[key] }) {
        return await (await this.getModelInstance()).update(set, query);
    }

    public async upsert(set: CreationAttributes<Model<TM>>, option?: UpsertOptions<TM>): Promise<[TM, boolean | null]> {
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
