import { Types } from 'mongoose';

import DM from '@/tools/dameng';
import { log } from '@/configs';
import SQL from './sql';

import { DmModel, QueryOption, UpdateOption } from './typings';
import { typeIs } from '@/utils';

const DMDBModel: Record<string, DmModel<Record<string, unknown>>> = {};


export default class DMBase<TB>{
    private tableName: string;

    constructor(tableName: string, struct: DmModel<TB>, option?: { tenantId?: string, DBName?: string }) {
        this.tableName = tableName;

        if (option) {
            const { tenantId, DBName } = option;

            if (tenantId) {
                this.tableName = `${tenantId}_${this.tableName}`;
            }
            if (DBName) {
                this.tableName = `${DBName}.${this.tableName}`;
            }
        }

        DMDBModel[this.tableName] = struct;
    }

    private async execute(sql: string) {
        log('dmdb-execute-sql').debug(sql);
        return await DM.server?.execute(sql, [], { outFormat: 'OUT_FORMAT_OBJECT' as unknown as number });
    }

    private dataFormat(dbData: Record<string, unknown>): TB {
        const struct = DMDBModel[this.tableName] as DmModel<TB>;
        const data: { [P in keyof TB]?: TB[P] } = {};

        for (const key in struct) {
            const { type } = struct[key];

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            data[key] = dbData[key];

            if (type === 'DATE' && !typeIs(data[key], 'date')) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[key] = new Date(data[key]);
            } else if (struct[key].type === 'STRING' && !typeIs(data[key], 'string')) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[key] = `${data[key]}`.trim();
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
        const sql = SQL.getInsertSql(this.formatInsertData(data), this.tableName);

        await this.execute(sql);
    }

    public async insertMany(data: Array<TB>): Promise<void> {
        let sql = '';

        for (let s = 0; s < data.length; s++) {
            sql += SQL.getInsertSql(this.formatInsertData(data[s]), this.tableName);
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
        const sql = SQL.getUpdateSql(query, _update, this.tableName);

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

    public async find(query: QueryOption<TB>, projection?: Array<keyof TB>): Promise<Array<TB>> {
        const sql = SQL.getSelectSql(query, this.tableName, projection as Array<string> || Object.keys(DMDBModel[this.tableName]));

        return (await this.execute(sql))?.rows?.map((a: unknown) => this.dataFormat(a as Record<string, unknown>)) as Array<TB>;
    }

    public async findOne(query: QueryOption<TB>, projection?: Array<keyof TB>): Promise<TB | null> {
        return (await this.find(query, projection))[0] || null;
    }

    public async page(query: QueryOption<TB>, option: { skip: number, limit: number }, projection?: Array<keyof TB>): Promise<{ list: Array<TB>, total: number }> {
        const sql = SQL.getPageSql(query, { ...option, tableName: this.tableName }, projection as Array<string> || Object.keys(DMDBModel[this.tableName]));

        return {
            list: (await this.execute(sql))?.rows?.map((a: unknown) => this.dataFormat(a as Record<string, unknown>)) as Array<TB>,
            total: (await this.count(query)).count
        };
    }

    public async count(query: QueryOption<TB>): Promise<{ count: number }> {
        const data = (await this.execute(SQL.getCountSql(query, this.tableName)))?.rows as Array<Record<string, number>>;

        return {
            count: Object.values(data[0])[0]
        };
    }
}
