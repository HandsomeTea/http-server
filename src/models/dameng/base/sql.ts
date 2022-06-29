/* eslint-disable @typescript-eslint/no-explicit-any */
import { typeIs } from '@/utils';

import { QueryOption, SQLOption, UpdateOption, WhereOption } from 'dm-type';

type Model = Record<string, any>;

export default new class SQL {
    constructor() {
        //
    }

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
            return `to_date('${(value as Date).toLocaleString(undefined, { hour12: false }).replace(/\//g, '-')}','yyyy-mm-dd hh24:mi:ss')`;
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
                    typeof option.$regexp !== 'undefined' ||
                    typeof option.useFn !== 'undefined'
                )) {
                const { $between, $gt, $gte, $in, $like, $lt, $lte, $ne, $notIn, $regexp, useFn } = option as SQLOption<Model, keyof Model>;

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
                if (useFn) {
                    const { useForCol, fn, value } = useFn;

                    if (typeof useForCol === 'string') {
                        arr.push(`${useForCol}(${key}) = ${fn}(${this.getSqlValue(value)})`);
                    } else if (Boolean(useForCol) === true) {
                        arr.push(`${fn}(${key}) = ${fn}(${this.getSqlValue(value)})`);
                    } else {
                        arr.push(`${key} = ${fn}(${this.getSqlValue(value)})`);
                    }
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

    public getInsertSql(data: Model, option: { tableName: string, createdAt?: string, updatedAt?: string }): string {
        if (option.createdAt) {
            data[option.createdAt] = new Date();
        }
        if (option.updatedAt) {
            data[option.updatedAt] = new Date();
        }
        const keyStr = Object.keys(data).map(a => `"${a}"`).join(', ');
        const valueStr = Object.values(data).map(a => {
            return this.getSqlValue(a);
        }).join(', ');

        return `insert into ${option.tableName} (${keyStr}) values (${valueStr}) returning ${keyStr};`;
    }

    public getDeleteSql(query: Pick<QueryOption<Model>, 'where'>, tableName: string): string {
        return `delete from ${tableName} ${this.getQueryOption(query)};`;
    }

    public getUpdateSql(query: Pick<QueryOption<Model>, 'where'>, update: UpdateOption<Model>, option: { tableName: string, updatedAt?: string }): string {
        if (option.updatedAt) {
            update[option.updatedAt] = new Date();
        }
        return `update ${option.tableName} set ${this.getUpdateOption(update)} ${this.getQueryOption(query)};`;
    }

    // public getUpsertSql(insert: Model, update: UpsertOption<Model>, tableName: string): string {
    //     const keyStr = Object.keys(insert).join(',');
    //     const valueStr = Object.values(insert).map(a => {
    //         return this.getSqlValue(a);
    //     }).join(', ');

    //     return `insert into ${tableName} (${keyStr}) values (${valueStr}) on duplicate key update ${this.getUpdateOption(update)};`;
    // }

    public getSelectSql(query: QueryOption<Model>, tableName: string, projection: Array<keyof Model>): string {
        const fields = projection.map(a => `"${a}"`).join(', ');
        // const name = tableName.split('.');
        // const tbName = name.length > 1 ? `${tableName} as ${name[1]}` : tableName;

        return `select ${fields} from ${tableName} ${this.getQueryOption(query)};`;
    }

    public getPageSql(query: QueryOption<Model>, option: { skip: number, limit: number, tableName: string }, projection: Array<keyof Model>): string {
        const fields = projection.map(a => `"${a}"`).join(', ');
        // const name = option.tableName.split('.');
        // const tbName = name.length > 1 ? `${option.tableName} as ${name[1]}` : option.tableName;

        return `select ${fields} from ${option.tableName} ${this.getQueryOption(query)} limit ${option.skip}, ${option.limit};`;
    }

    public getCountSql(query: QueryOption<Model>, tableName: string): string {
        // const name = tableName.split('.');
        // const tbName = name.length > 1 ? `${tableName} as ${name[1]}` : tableName;

        return `select count(*) as count from ${tableName} ${this.getQueryOption(query)};`;
    }
};
