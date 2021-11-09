import { ModelAttributes, ModelCtor, DataTypes, Model, ModelOptions, CreateOptions, FindOptions, Identifier, FindAndCountOptions, DestroyOptions, UpdateOptions } from 'sequelize';
import MySQL from '@/tools/mysql';

// export default
class Base {
    public tableName: string;
    private model: ModelCtor<Model<DBModel>>;
    private modelIsSync: boolean;
    constructor(tableName: string, tableStruct: ModelAttributes<Model<DBModel>>, option?: ModelOptions) {
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

    public async insert(data: DBModel, option?: CreateOptions): Promise<DBModel> {
        return await (await this.getModelInstance()).create(data, option) as unknown as DBModel;
    }

    public async delete(option: DestroyOptions<DBModel>) {
        return await (await this.getModelInstance()).destroy(option);
    }

    public async update<TableModel>(query: UpdateOptions<DBModel>, set: { [key in keyof TableModel]?: TableModel[key] }): Promise<[number]> {
        return await (await this.getModelInstance()).update(set, query) as unknown as [number];
    }

    // public async upsert(query: UpsertOptions<DBModel>, set: DBModel): Promise<[number]> {
    //     return await (await this.getModelInstance()).upsert(set, query) as unknown as [number];
    // }

    public async find(query?: FindOptions<DBModel>) {
        return await (await this.getModelInstance()).findAll(query);
    }

    public async findOne(query: FindOptions<DBModel>) {
        return await (await this.getModelInstance()).findOne(query);
    }

    public async findById(id: Identifier, option?: Omit<FindOptions<DBModel>, 'where'>) {
        if (id) {
            return await (await this.getModelInstance()).findByPk(id, option);
        }
        return null;
    }

    public async paging(query: FindAndCountOptions<DBModel>) {
        return await (await this.getModelInstance()).findAndCountAll(query);
    }
}

export default new class User extends Base {
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
