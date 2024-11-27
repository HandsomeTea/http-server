// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dmdb from 'dmdb';
import { Types } from 'mongoose';

import DM from '@/tools/dameng';
import { log } from '@/configs';
import SQL from './sql';

import { DmModel, QueryOption, UpdateOption } from 'dm-type';
import { typeIs } from '@coco-sheng/js-tools';
import { DmType } from './index';

const DMDBModel: Record<string, DmModel<Record<string, unknown>>> = {};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class DMBase<TB extends Record<string, any>>{
    private tableName: string;
    private timestamp: {
        createdAt?: string
        updatedAt?: string
    };

    constructor(
        tableName: string,
        struct: DmModel<TB>,
        option?: {
            modelName?: string
            tenantId?: string,
            createdAt?: string | boolean
            updatedAt?: string | boolean
        }
    ) {
        this.tableName = tableName;
        this.timestamp = {};

        if (option) {
            const { tenantId, modelName, createdAt, updatedAt } = option;

            if (tenantId) {
                this.tableName = `${tenantId}_${this.tableName}`;
            }
            if (modelName) {
                this.tableName = `${modelName}.${this.tableName}`;
            } else {
                this.tableName = `test.${this.tableName}`;
            }
            if (createdAt) {
                this.timestamp.createdAt = typeof createdAt === 'string' ? createdAt : 'createdAt';
            }
            if (updatedAt) {
                this.timestamp.updatedAt = typeof updatedAt === 'string' ? updatedAt : 'updatedAt';
            }
        }
        this.tableName = this.tableName.split('.').map(a => `"${a}"`).join('.');

        DMDBModel[this.tableName] = {
            ...struct,
            ...this.timestamp.createdAt ? { [this.timestamp.createdAt]: { type: DmType.DATE } } : {},
            ...this.timestamp.updatedAt ? { [this.timestamp.updatedAt]: { type: DmType.DATE } } : {}
        };
    }

    private async execute(sql: string) {
        log('dmdb-execute-sql').debug(sql);
        return await DM.server?.execute(sql, [], { outFormat: dmdb.OUT_FORMAT_OBJECT });
    }

    private dataFormat(dbData: Record<string, unknown>, projection: Array<keyof TB>): TB {
        const struct = DMDBModel[this.tableName] as DmModel<TB>;
        const data: { [P in keyof TB]?: TB[P] } = {};

        for (const key in projection) {
            if (typeof dbData[key] !== 'undefined') {
                // const { type } = struct[key];

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[key] = dbData[key];

                if (struct[key].type === 'STRING') {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    data[key] = `${data[key]}`.trim();
                }
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[key] = null;
            }
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return data;
    }

    private formatInsertData(data: TB): TB {
        const struct = DMDBModel[this.tableName] as DmModel<TB>;
        const _data: { [P in keyof TB]?: TB[P] } = {};

        for (const key in struct) {
            const { set, defaultValue } = struct[key];

            if (set || defaultValue) {
                if (typeof defaultValue !== 'undefined' && typeof data[key] === 'undefined') {
                    if (typeof defaultValue !== 'function') {
                        _data[key] = defaultValue;
                    } else {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        _data[key] = defaultValue();
                    }
                }
                if (set && (data[key] || _data[key])) {
                    _data[key] = set(data[key] || _data[key]);
                }
            }
            if (typeof _data[key] === 'undefined' && typeof data[key] !== 'undefined') {
                _data[key] = data[key];
            }
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return _data;
    }

    /**
     * 生成一个可以作为primaryKey的随机字符串
     * @readonly
     * @memberof SqlBase
     */
    public get randomId() {
        return new Types.ObjectId().toString();
    }

    public async insert(data: TB): Promise<void> {
        const sql = SQL.getInsertSql(this.formatInsertData(data), { tableName: this.tableName, ...this.timestamp });

        await this.execute(sql);
    }

    public async insertMany(data: Array<TB>): Promise<void> {
        let sql = '';

        for (let s = 0; s < data.length; s++) {
            sql += SQL.getInsertSql(this.formatInsertData(data[s]), { tableName: this.tableName, ...this.timestamp });
        }
        await this.execute(sql);
    }

    public async delete(query: Pick<QueryOption<TB>, 'where'>): Promise<void> {
        const sql = SQL.getDeleteSql(query, this.tableName);

        await this.execute(sql);
    }

    public async update(query: Pick<QueryOption<TB>, 'where'>, update: UpdateOption<TB>): Promise<void> {
        const struct = DMDBModel[this.tableName] as DmModel<TB>;
        const _update: { [P in keyof TB]?: TB[P] } = {};

        for (const key in update) {
            const { set } = struct[key];

            if (set) {
                if (!typeIs(update[key], 'object')) {
                    _update[key] = set(update[key]);

                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                } else if (update[key].$pull) { // 提示：$pull一定是对字符串的操作

                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    _update[key] = { ...update[key], $pull: set(update[key].$pull) };
                }
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                _update[key] = update[key];
            }
        }
        const sql = SQL.getUpdateSql(query, _update, { tableName: this.tableName, ...this.timestamp });

        await this.execute(sql);
    }

    public async upsert(uniqueQuery: Pick<QueryOption<TB>, 'where'>, update: UpdateOption<TB>, insert: TB): Promise<void> {
        const data = await this.findOne(uniqueQuery);

        if (data) {
            await this.update(uniqueQuery, update);
        } else {
            await this.insert(insert);
        }
    }

    public async find(): Promise<Array<TB>>
    public async find(query: QueryOption<TB>): Promise<Array<TB>>
    public async find<K extends keyof TB>(query: QueryOption<TB>, projection: Array<K>): Promise<Array<{ [F in K]: TB[F] }>>

    public async find(query?: QueryOption<TB>, projection?: Array<keyof TB>): Promise<Array<TB>> {
        const fields = (projection || Object.keys(DMDBModel[this.tableName])) as Array<string>;
        const sql = SQL.getSelectSql(query || {}, this.tableName, fields);

        return (await this.execute(sql))?.rows?.map((a: unknown) => this.dataFormat(a as Record<string, unknown>, fields as Array<keyof TB>)) as Array<TB>;
    }

    public async findOne(query: QueryOption<TB>): Promise<TB | null>
    public async findOne<K extends keyof TB>(query: QueryOption<TB>, projection: Array<K>): Promise<{ [F in K]: TB[F] } | null>

    public async findOne(query: QueryOption<TB>, projection?: Array<keyof TB>): Promise<TB | null> {
        const fields = (projection || Object.keys(DMDBModel[this.tableName]));

        return (await this.find({ ...query, offset: 0, limit: 1 }, fields))[0] || null;
    }

    public async paging(query: QueryOption<TB>, option: { skip: number, limit: number }): Promise<{ list: Array<TB>, total: number }>
    public async paging<K extends keyof TB>(query: QueryOption<TB>, option: { skip: number, limit: number }, projection: Array<K>): Promise<{ list: Array<{ [F in K]: TB[F] }>, total: number }>

    public async paging(query: QueryOption<TB>, option: { skip: number, limit: number }, projection?: Array<keyof TB>): Promise<{ list: Array<TB>, total: number }> {
        const fields = (projection || Object.keys(DMDBModel[this.tableName])) as Array<string>;
        const sql = SQL.getPageSql(query, { ...option, tableName: this.tableName }, fields);

        return {
            list: (await this.execute(sql))?.rows?.map((a: unknown) => this.dataFormat(a as Record<string, unknown>, fields as Array<keyof TB>)) as Array<TB>,
            total: await this.count(query)
        };
    }

    public async count(query: QueryOption<TB>): Promise<number> {
        const data = (await this.execute(SQL.getCountSql(query, this.tableName)))?.rows as Array<Record<string, number>>;

        return Number(Object.values(data[0])[0]);
    }
}
