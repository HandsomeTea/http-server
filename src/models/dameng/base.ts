import { Types } from 'mongoose';
import { log } from '@/configs';
import { typeIs } from '@/utils';
import DM from '@/tools/dameng';

interface SQLOption<M, P extends keyof M> {
    $ne?: M[P]
    $in?: Array<M[P]>
    $notIn?: Array<M[P]>
    $like?: string
    $regexp?: string | RegExp
    $between?: [M[P], M[P]]
    $gt?: M[P]
    $lt?: M[P]
    $gte?: M[P]
    $lte?: M[P]
}

type WhereOption<M> = {
    [P in keyof M]?: M[P] | SQLOption<M, P>
}

interface QueryOption<M> {
    where?: WhereOption<M> & { $or?: Array<WhereOption<M>> }
    order?: Array<{ [P in keyof M]?: 'asc' | 'desc' }>
    limit?: number
    offset?: number
}

// type UpsertOption<M> = { [P in keyof M]?: M[P] }
type UpdateOption<M> = { [P in keyof M]?: M[P] extends string ? string | { $pull: M[P], $split: ',' } : M[P] }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class SQL<Model extends Record<string, any>> {
    private tableName: string;
    // private db: DBServerType;

    constructor(tableName: string, tenantId?: string, DBName?: string) {
        if (tenantId) {
            this.tableName = `${tenantId}_${tableName}`;
        } else {
            this.tableName = tableName;
        }
        if (DBName) {
            this.tableName = `${DBName}.${this.tableName}`;
        }
        // this.db = getENV('DB_TYPE');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private getSqlValue(value: any) {
        const type = typeIs(value);

        if (!new Set(['string', 'number', 'bigint', 'undefined', 'date', 'null']).has(type)) {
            throw new Exception(`SQL does not support storage of this data type: ${type}`);
        }

        if (type === 'string') {
            return `'${value}'`;
        } else if (type === 'number' || type === 'bigint') {
            return value;
        } else if (type === 'undefined' || type === 'null') {
            return 'null';
        } else if (type === 'date') {
            // if (this.db === 'mysql') {
            //     return `str_to_date('${(value as Date).toLocaleString(undefined, { hour12: false }).replace(/\//g, '-')}','%Y-%c-%e %H:%i:%s')`;
            // }
            return `to_date('${(value as Date).toLocaleString(undefined, { hour12: false }).replace(/\//g, '-')}','yyyy-mm-dd hh24:mi:ss:ssxff')`;
        }
    }

    private getWhereQuery(where: WhereOption<Model>): Array<string> {
        const arr: Array<string> = [];
        const isVal = new Set(['null', true, false]);

        for (const key in where) {
            const option = where[key];

            if (typeIs(option) === 'object'
                && (typeof option.$between !== 'undefined' ||
                    typeof option.$gt !== 'undefined' ||
                    typeof option.$gte !== 'undefined' ||
                    typeof option.$in !== 'undefined' ||
                    typeof option.$like !== 'undefined' ||
                    typeof option.$lt !== 'undefined' ||
                    typeof option.$lte !== 'undefined' ||
                    typeof option.$ne !== 'undefined' ||
                    typeof option.$notIn !== 'undefined' ||
                    typeof option.$regexp !== 'undefined'
                )) {
                const { $between, $gt, $gte, $in, $like, $lt, $lte, $ne, $notIn, $regexp } = option as SQLOption<Model, keyof Model>;

                if ($between) {
                    arr.push(`${key} between ${this.getSqlValue($between[0])} and ${this.getSqlValue($between[1])}`);
                }
                if (typeof $gt !== 'undefined') {
                    arr.push(`${key} > ${this.getSqlValue($gt)}`);
                }
                if (typeof $gte !== 'undefined') {
                    arr.push(`${key} >= ${this.getSqlValue($gte)}`);
                }
                if ($in) {
                    const _in = $in.map(a => this.getSqlValue(a));

                    arr.push(`${key} in (${_in.join(', ')})`);
                }
                if ($like) {
                    arr.push(`${key} like '%${$like}%'`);
                }
                if (typeof $lt !== 'undefined') {
                    arr.push(`${key} > ${this.getSqlValue($lt)}`);
                }
                if (typeof $lte !== 'undefined') {
                    arr.push(`${key} >= ${this.getSqlValue($lte)}`);
                }
                if (typeof $ne !== 'undefined') {
                    const value = this.getSqlValue($ne);

                    arr.push(isVal.has(value) ? `${key} is not ${value}` : `${key}!=${value}`);
                }
                if ($notIn) {
                    const _notIn = $notIn.map(a => this.getSqlValue(a));

                    arr.push(`${key} not in (${_notIn.join(', ')})`);
                }
                if ($regexp) {
                    let regStr = new RegExp($regexp as string | RegExp, '').toString();

                    regStr = regStr.substring(1, regStr.length - 1);
                    arr.push(`${key} regexp ${regStr}`);
                }
            } else {
                const value = this.getSqlValue(option);

                arr.push(isVal.has(value) ? `${key} is ${value}` : `${key}=${value}`);
            }
        }
        return arr;
    }

    private getQueryOption(query: QueryOption<Model>): string {
        const { where, order, offset = 0, limit } = query;

        const orArr: Array<string> = [];
        const andArr: Array<string> = [];

        if (where) {
            const { $or } = where;

            if ($or) {
                for (let s = 0; s < $or.length; s++) {
                    orArr.push(...this.getWhereQuery($or[s]));
                }
            }
            const _where = { ...where };

            delete _where.$or;
            andArr.push(...this.getWhereQuery(_where));
        }

        const orderArr: Array<string> = [];

        if (order) {
            for (let s = 0; s < order.length; s++) {
                orderArr.push(`${Object.keys(order[s])[0]} ${Object.values(order[s])[0]}`);
            }
        }

        let str = '';
        const queryArr: Array<string> = [];

        if (orArr.length > 0) {
            queryArr.push(`(${orArr.join(' or ')})`);
        }

        if (andArr.length > 0) {
            queryArr.push(`(${andArr.join(' and ')})`);
        }

        if (queryArr.length > 0) {
            str = `where ${queryArr.join(' and ')}`;
        }

        if (orderArr.length > 0) {
            if (str) {
                str += ' ';
            }
            str += `order by ${orderArr.join(', ')}`;
        }

        if (typeof offset !== 'undefined' && typeof limit !== 'undefined') {
            if (str) {
                str += ' ';
            }
            str += `limit ${offset}, ${limit}`;
        }
        return str;
    }

    private getUpdateOption(update: UpdateOption<Model>): string {
        if (Object.keys(update).length === 0) {
            throw new Exception('one field must be updated at least!');
        }
        const arr: Array<string> = [];

        for (const key in update) {
            const aa = update[key];

            if (aa.$pull && aa.$split) {
                arr.push(`${key}=replace(replace(${key}, '${aa.$pull}${aa.$split}', ''), '${aa.$pull}', '')`);
            } else {
                arr.push(`${key}=${this.getSqlValue(update[key])}`);
            }
        }
        return arr.join(', ');
    }

    public getInsertSql(data: Model): string {
        const keyStr = Object.keys(data).map(a => `"${a}"`).join(', ');
        const valueStr = Object.values(data).map(a => {
            return this.getSqlValue(a);
        }).join(', ');

        return `insert into ${this.tableName} (${keyStr}) values (${valueStr});`;
    }

    public getDeleteSql(query: Pick<QueryOption<Model>, 'where'>): string {
        return `delete from ${this.tableName} ${this.getQueryOption(query)};`;
    }

    public getUpdateSql(query: Pick<QueryOption<Model>, 'where'>, update: UpdateOption<Model>): string {
        return `update ${this.tableName} set ${this.getUpdateOption(update)} ${this.getQueryOption(query)};`;
    }

    // public getUpsertSql(insert: Model, update: UpsertOption<Model>): string {
    //     const keyStr = Object.keys(insert).join(',');
    //     const valueStr = Object.values(insert).map(a => {
    //         return this.getSqlValue(a);
    //     }).join(', ');

    //     return `insert into ${this.tableName} (${keyStr}) values (${valueStr}) on duplicate key update ${this.getUpdateOption(update)};`;
    // }

    public getSelectSql(query: QueryOption<Model>, projection?: Array<keyof Model>): string {
        return `select ${projection ? projection.join(', ') : '*'} from ${this.tableName} ${this.getQueryOption(query)};`;
    }

    public getPageSql(query: QueryOption<Model>, option: { skip: number, limit: number }, projection?: Array<keyof Model>): string {
        return `select ${projection ? projection.join(', ') : '*'} from ${this.tableName} ${this.getQueryOption(query)} limit ${option.skip}, ${option.limit};`;
    }

    public getCountSql(query: QueryOption<Model>): string {
        return `select count(*) as count from ${this.tableName} ${this.getQueryOption(query)};`;
    }
}

export default class SQLBase<TB> extends SQL<TB>{
    constructor(tableName: string, tenantId?: string, DBName?: string) {
        super(tableName, tenantId, DBName);
    }

    private async execute(sql: string) {
        log('dmdb-execute-sql').debug(sql);
        return await DM.server?.execute(sql, [], { outFormat: 'OUT_FORMAT_OBJECT' as unknown as number });
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
        await this.execute(this.getInsertSql(data));
    }

    public async delete(query: Pick<QueryOption<TB>, 'where'>): Promise<void> {
        await this.execute(this.getDeleteSql(query));
    }

    public async update(query: Pick<QueryOption<TB>, 'where'>, update: UpdateOption<TB>): Promise<void> {
        await this.execute(this.getUpdateSql(query, update));
    }

    public async find(query: QueryOption<TB>, projection?: Array<keyof TB>): Promise<Array<TB>> {
        return (await this.execute(this.getSelectSql(query, projection)))?.rows as Array<TB>;
    }

    public async findOne(query: QueryOption<TB>, projection?: Array<keyof TB>): Promise<TB | null> {
        return (await this.find(query, projection))[0] || null;
    }

    public async page(query: QueryOption<TB>, option: { skip: number, limit: number }, projection?: Array<keyof TB>): Promise<{ list: Array<TB>, total: number }> {
        return {
            list: (await this.execute(this.getPageSql(query, option, projection)))?.rows as Array<TB>,
            total: (await this.count(query)).count
        };
    }

    public async count(query: QueryOption<TB>): Promise<{ count: number }> {
        const data = (await this.execute(this.getCountSql(query)))?.rows as Array<Record<string, number>>;

        return {
            count: Object.values(data[0])[0]
        };
    }
}
