import { Types } from 'mongoose';

import DM from '@/tools/dameng';
import { log } from '@/configs';
import SQL from './dm-sql';

import { DmModel, QueryOption, UpdateOption } from './typings';
import { typeIs } from '@/utils';

type DMDBModelType = Record<string, DmModel<Record<string, unknown>>>

const DMDBModel: DMDBModelType = {};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class DMBase<TB extends Record<string, any>>{
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
            const { type, dbField } = struct[key];

            if (dbField) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[key] = dbData[dbField];
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[key] = dbData[key];
            }

            if (type === 'DATE' && !typeIs(data[key], 'date')) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[key] = new Date(data[key]);
            } else if (struct[key].type === 'STRING' && !typeIs(data[key], 'string')) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data[key] = `${data[key]}`.trim();
            }
            // else if (struct[key].type === 'NUMBER' && !typeIs(data[key], 'number')) {
            //     data[key] = Number(data[key]);
            // }
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return data;
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
        await this.execute(SQL.getInsertSql(data, this.tableName));
    }

    public async delete(query: Pick<QueryOption<TB>, 'where'>): Promise<void> {
        await this.execute(SQL.getDeleteSql(query, this.tableName));
    }

    public async update(query: Pick<QueryOption<TB>, 'where'>, update: UpdateOption<TB>): Promise<void> {
        await this.execute(SQL.getUpdateSql(query, update, this.tableName));
    }

    public async find(query: QueryOption<TB>, projection?: Array<keyof TB>): Promise<Array<TB>> {
        return (await this.execute(SQL.getSelectSql(query, this.tableName, projection as Array<string> || [])))?.rows
            ?.map(a => this.dataFormat(a as Record<string, unknown>)) as Array<TB>;
    }

    public async findOne(query: QueryOption<TB>, projection?: Array<keyof TB>): Promise<TB | null> {
        return (await this.find(query, projection))[0] || null;
    }

    public async page(query: QueryOption<TB>, option: { skip: number, limit: number }, projection?: Array<keyof TB>): Promise<{ list: Array<TB>, total: number }> {
        return {
            list: (await this.execute(SQL.getPageSql(query, { ...option, tableName: this.tableName }, projection as Array<string> || [])))?.rows
                ?.map(a => this.dataFormat(a as Record<string, unknown>)) as Array<TB>,
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
