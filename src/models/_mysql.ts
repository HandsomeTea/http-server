import { ModelAttributes, ModelCtor, DataTypes, Model, ModelOptions, CreateOptions, FindOptions, Identifier, FindAndCountOptions, DestroyOptions, UpdateOptions } from 'sequelize';
import MySQL from '@/tools/mysql';

// export default
class Base<TM>{
    public tableName: string;
    private model: ModelCtor<Model<TM>>;
    private modelIsSync: boolean;
    constructor(tableName: string, tableStruct: ModelAttributes<Model<TM>>, option?: ModelOptions) {
        this.tableName = tableName;
        this.model = MySQL.server.define(this.tableName, tableStruct, {
            ...option,
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

    public async update(query: UpdateOptions<TM>, set: { [key in keyof TM]?: TM[key] }): Promise<[number]> {
        return await (await this.getModelInstance()).update(set, query) as unknown as [number];
    }

    // public async upsert(query: UpsertOptions<TM>, set: TM): Promise<[number]> {
    //     return await (await this.getModelInstance()).upsert(set, query) as unknown as [number];
    // }

    public async find(query?: FindOptions<TM>) {
        return await (await this.getModelInstance()).findAll(query);
    }

    public async findOne(query: FindOptions<TM>) {
        return await (await this.getModelInstance()).findOne(query);
    }

    public async findById(id: Identifier, option?: Omit<FindOptions<TM>, 'where'>) {
        if (id) {
            return await (await this.getModelInstance()).findByPk(id, option);
        }
        return null;
    }

    public async paging(query: FindAndCountOptions<TM>) {
        return await (await this.getModelInstance()).findAndCountAll(query);
    }
}

export default new class User extends Base<TestUser> {
    constructor() {
        const model: ModelAttributes<Model<TestUser>> = {
            _id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                unique: true,
                comment: '唯一性标志'
            },
            account: {
                type: DataTypes.STRING
            }
        };

        super('user', model, {
            omitNull: true,
            indexes: [{
                unique: true,
                fields: ['_id']
            }]
        });
    }
};
