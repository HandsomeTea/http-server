/* eslint-disable @typescript-eslint/no-explicit-any */
import { typeIs } from '@/utils';

interface QueryOption<M> {
    $and?: { [P in keyof M]?: M[P] }
    $or?: { [P in keyof M]?: M[P] }
    $ne?: { [P in keyof M]?: M[P] }
    $in?: { [P in keyof M]?: Array<M[P]> }
    $notIn?: { [P in keyof M]?: Array<M[P]> }
    $like?: { [P in keyof M as P extends string ? `$${P}` | `${P}$` | `$${P}$` | P : P]?: M[P] }
    $regexp?: { [P in keyof M]?: string | RegExp }
    $between?: { [P in keyof M]?: [M[P], M[P]] }
    $gt?: { [P in keyof M]?: M[P] }
    $lt?: { [P in keyof M]?: M[P] }
    $gte?: { [P in keyof M]?: M[P] }
    $lte?: { [P in keyof M]?: M[P] }
    $order?: Array<{ [P in keyof M]?: 'asc' | 'desc' }>
}

// type UpsertOption<M> = { [P in keyof M]?: M[P] }
type UpdateOption<M> = { [P in keyof M]?: M[P] extends string ? M[P] | { $pull: M[P], $split: ',' } : M[P] }

export default class SQL<Model extends Record<string, any>> {
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    private getSqlValue(value: any) {
        const type = typeIs(value);

        if (!new Set(['string', 'number', 'bigint', 'boolean', 'undefined', 'date', 'null']).has(type)) {
            throw new Exception(`SQL does not support storage of this data type: ${type}`);
        }

        if (type === 'string') {
            return `'${value}'`;
        } else if (type === 'number' || type === 'bigint' || type === 'boolean') {
            return value;
        } else if (type === 'undefined' || type === 'null') {
            return 'null';
        } else if (type === 'date') {
            return `to_date('${(value as Date).toLocaleString(undefined, { hour12: false }).replace(/\//g, '-')}','yyyy-mm-dd hh24:mi:ss:ssxff')`;
        }
    }

    private getQueryOption(query: QueryOption<Model>): string {
        const addArr: Array<string> = [];
        const orArr: Array<string> = [];
        const neArr: Array<string> = [];
        const inArr: Array<string> = [];
        const notInArr: Array<string> = [];
        const likeArr: Array<string> = [];
        const regexpArr: Array<string> = [];
        const betweenArr: Array<string> = [];
        const gtArr: Array<string> = [];
        const ltArr: Array<string> = [];
        const gteArr: Array<string> = [];
        const lteArr: Array<string> = [];
        const orderArr: Array<string> = [];
        const { $and, $or, $ne, $in, $notIn, $like, $regexp, $between, $gt, $lt, $gte, $lte, $order } = query;

        const isVal = new Set(['null', true, false]);

        if ($and) {
            for (const key in $and) {
                const value = this.getSqlValue($and[key]);

                addArr.push(isVal.has(value) ? `${key} is ${value}` : `${key}=${value}`);
            }
        }

        if ($or) {
            for (const key in $or) {
                const value = this.getSqlValue($or[key]);

                orArr.push(isVal.has(value) ? `${key} is ${value}` : `${key}=${value}`);
            }
        }

        if ($ne) {
            for (const key in $ne) {
                const value = this.getSqlValue($ne[key]);

                neArr.push(isVal.has(value) ? `${key} is not ${value}` : `${key}!=${value}`);
            }
        }

        if ($in) {
            for (const key in $in) {
                const _in = $in[key]?.map(a => this.getSqlValue(a));

                if (_in && _in.length > 0) {
                    inArr.push(`${key} in (${_in.join(', ')})`);
                }
            }
        }

        if ($notIn) {
            for (const key in $notIn) {
                const _notIn = $notIn[key]?.map(a => this.getSqlValue(a));

                if (_notIn && _notIn.length > 0) {
                    notInArr.push(`${key} not in (${_notIn.join(', ')})`);
                }
            }
        }

        if ($like) {
            for (const key in $like) {
                if (!$like[key]) {
                    continue;
                }
                const count$ = key.split('$').length - 1;

                if (count$ === 2) {
                    likeArr.push(`${key.replace(/\$/g, '')} like '%${$like[key]}%'`);
                } else if (count$ === 0) {
                    likeArr.push(`${key}=${$like[key]}`);
                } else if (key[0] === '$') {
                    likeArr.push(`${key.replace(/\$/g, '')} like '${$like[key]}%'`);
                } else {
                    likeArr.push(`${key.replace(/\$/g, '')} like '%${$like[key]}'`);
                }
            }
        }

        if ($regexp) {
            for (const key in $regexp) {
                let regStr = new RegExp($regexp[key] as string | RegExp, '').toString();

                regStr = regStr.substring(1, regStr.length - 1);
                regexpArr.push(`${key} regexp ${regStr}`);
            }
        }

        if ($between) {
            for (const key in $between) {
                betweenArr.push(`${key} between ${this.getSqlValue($between[key]?.[0])} and ${this.getSqlValue($between[key]?.[1])}`);
            }
        }

        if ($gt) {
            for (const key in $gt) {
                gtArr.push(`${key} > ${this.getSqlValue($gt[key])}`);
            }
        }

        if ($lt) {
            for (const key in $lt) {
                ltArr.push(`${key} < ${this.getSqlValue($lt[key])}`);
            }
        }

        if ($gte) {
            for (const key in $gte) {
                gteArr.push(`${key} >= ${this.getSqlValue($gte[key])}`);
            }
        }

        if ($lte) {
            for (const key in $lte) {
                lteArr.push(`${key} <= ${this.getSqlValue($lte[key])}`);
            }
        }

        if ($order) {
            for (let s = 0; s < $order.length; s++) {
                orderArr.push(`${Object.keys($order[s])[0]} ${Object.values($order[s])[0]}`);
            }
        }

        const queryArr: Array<string> = [];

        if (addArr.length > 0) {
            queryArr.push(`(${addArr.join(' and ')})`);
        }
        if (orArr.length > 0) {
            queryArr.push(`(${orArr.join(' or ')})`);
        }
        if (neArr.length > 0) {
            queryArr.push(`(${neArr.join(' and ')})`);
        }
        if (inArr.length > 0) {
            queryArr.push(`(${inArr.join(' and ')})`);
        }
        if (notInArr.length > 0) {
            queryArr.push(`(${notInArr.join(' and ')})`);
        }
        if (likeArr.length > 0) {
            queryArr.push(`(${likeArr.join(' and ')})`);
        }
        if (regexpArr.length > 0) {
            queryArr.push(`(${regexpArr.join(' and ')})`);
        }
        if (betweenArr.length > 0) {
            queryArr.push(`(${betweenArr.join(' and ')})`);
        }
        if (gtArr.length > 0) {
            queryArr.push(`(${gtArr.join(' and ')})`);
        }
        if (ltArr.length > 0) {
            queryArr.push(`(${ltArr.join(' and ')})`);
        }
        if (gteArr.length > 0) {
            queryArr.push(`(${gteArr.join(' and ')})`);
        }
        if (lteArr.length > 0) {
            queryArr.push(`(${lteArr.join(' and ')})`);
        }
        let str = '';

        if (queryArr.length > 0) {
            str = `where ${queryArr.join(' and ')}`;
        }

        if (orderArr.length > 0) {
            str += ` order by ${orderArr.join(', ')}`;
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
        const keyStr = Object.keys(data).join(',');
        const valueStr = Object.values(data).map(a => {
            return this.getSqlValue(a);
        }).join(', ');

        return `insert into ${this.tableName} (${keyStr}) values (${valueStr});`;
    }

    public getDeleteSql(query: Omit<QueryOption<Model>, '$order'>): string {
        return `delete from ${this.tableName} ${this.getQueryOption(query)};`;
    }

    public getUpdateSql(query: Omit<QueryOption<Model>, '$order'>, update: UpdateOption<Model>): string {
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
        return `select count(*) from ${this.tableName} ${this.getQueryOption(query)};`;
    }
}
