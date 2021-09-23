import { Connection } from 'mysql';
import MySQL from '@/tools/mysql';

export default class Base {
    private model: Connection;
    constructor() {
        this.model = MySQL.server;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async excute(sql: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.query(sql, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    }

    /**
     * 生成mysql的条件(查询/更新)语句
     *
     * @param {Array<string>} option 条件
     * @param {(' and ' | ', ')} [split=' and '] 条件之间的连接符，默认' and '
     * @param {('where' | 'set')} [type='where'] 条件与sql语句的连接符，默认'where'
     * @returns {string}
     * @memberof Base
     */
    public optionString(option: Array<string>, split: ' and ' | ', ' = ' and ', type: 'where' | 'set' = 'where'): string {
        if (option.length === 0) {
            return '';
        }

        return `${type} ${option.join(split)}`;
    }
}


// import { base64Encode } from '@/utils';
// import Base from './base';

// class User extends Base {
//     private tableName = 'admin_user';
//     constructor() {
//         super();
//         this.init();
//     }

//     private async init() {
//         await this.excute(
//             `CREATE TABLE IF NOT EXISTS ${this.tableName} (
//                 name VARCHAR(100) NOT NULL COMMENT '姓名',
//                 account VARCHAR(100) NOT NULL COMMENT '管理员登录账号',
//                 password VARCHAR(500) NOT NULL COMMENT '管理员登录密码',
//                 phone VARCHAR(100) COMMENT '管理员手机号',
//                 token VARCHAR(500) COMMENT '登录的token',
//                 tokenExpireAt VARCHAR(100) COMMENT '登录token的到期时间',
//                 PRIMARY KEY (account)
//             )
//             ENGINE=InnoDB DEFAULT CHARSET=utf8`
//         );
//         const admins = await this.find();

//         if (admins.length === 0) {
//             await this.save({ name: 'admin', account: 'admin', password: 'admin123', phone: '' });
//         }
//     }

//     async save(user: AdminUserModel) {
//         const { name, account, password, phone } = user;

//         return await this.excute(`insert into ${this.tableName} values ("${name}", "${account}", "${base64Encode(password)}", "${phone || ''}", "", "")`);
//     }

//     async delete(option: { name?: string, account?: string, phone?: string }) {
//         const { name, account, phone } = option;
//         const sqlOption: Array<string> = [];

//         if (name) {
//             sqlOption.push(`name="${name}"`);
//         }
//         if (account) {
//             sqlOption.push(`account="${account}"`);
//         }
//         if (phone) {
//             sqlOption.push(`phone="${phone}"`);
//         }

//         if (sqlOption.length > 0) {
//             return await this.excute(`delete from ${this.tableName} ${this.optionString(sqlOption)}`);
//         }
//     }

//     async update(account: string, update: { name?: string, password?: string, phone?: string, token?: string, tokenExpireAt?: Date }) {
//         const { name, password, phone, token, tokenExpireAt } = update;
//         const sqlOption: Array<string> = [];

//         if (name) {
//             sqlOption.push(`name="${name}"`);
//         }
//         if (password) {
//             sqlOption.push(`password="${base64Encode(password)}"`);
//             sqlOption.push('token=""');
//             sqlOption.push('tokenExpireAt=""');
//         } else {
//             if (token) {
//                 sqlOption.push(`token="${token}"`);
//             }
//             if (tokenExpireAt) {
//                 sqlOption.push(`tokenExpireAt="${tokenExpireAt.toISOString()}"`);
//             }
//         }
//         if (phone) {
//             sqlOption.push(`phone="${phone}"`);
//         }

//         if (sqlOption.length > 0) {
//             return await this.excute(`update ${this.tableName} ${this.optionString(sqlOption, ', ', 'set')} where account="${account}"`);
//         }
//     }

//     async find(option?: {
//         account?: string
//         name?: string,
//         phone?: string
//         password?: string
//         token?: string
//         keyword?: string
//     }, page?: { skip?: number, limit?: number }, fields?: Array<keyof AdminUserModel>): Promise<Array<AdminUserModel>> {
//         let limit = 10;
//         let skip = 0;

//         if (page?.limit) {
//             limit = page.limit;
//         }

//         if (page?.skip) {
//             skip = page.skip;
//         }

//         let fieldStr = '*';

//         if (fields && fields.length > 0) {
//             fieldStr = fields.join(',');
//         }

//         if (option?.keyword) {
//             return await this.excute(`select ${fieldStr} from ${this.tableName} where concat(name, account, phone) like "%${option.keyword}%" limit ${limit} offset ${skip}`);
//         }
//         const sqlOption: Array<string> = [];

//         if (option?.account) {
//             sqlOption.push(`account="${option.account}"`);
//         }

//         if (option?.name) {
//             sqlOption.push(`name="${option.name}"`);
//         }

//         if (option?.phone) {
//             sqlOption.push(`phone="${option.phone}"`);
//         }

//         if (option?.password) {
//             sqlOption.push(`password="${base64Encode(option.password)}"`);
//         }

//         if (option?.token) {
//             sqlOption.push(`token="${option.token}"`);
//         }

//         return await this.excute(`select ${fieldStr} from ${this.tableName} ${this.optionString(sqlOption)} limit ${limit} offset ${skip}`);
//     }

//     async count(option?: { name?: string, phone?: string, keyword?: string }): Promise<number> {
//         const sqlOption: Array<string> = [];

//         if (option?.keyword) {
//             sqlOption.push(`concat(name, account, phone) like "%${option.keyword}%"`);
//         } else {
//             if (option?.name) {
//                 sqlOption.push(`name="${option.name}"`);
//             }
//             if (option?.phone) {
//                 sqlOption.push(`phone="${option.phone}"`);
//             }
//         }

//         return (await this.excute(`select count(${this.tableName}.account) from ${this.tableName} ${this.optionString(sqlOption)}`))[0][`count(${this.tableName}.account)`];
//     }
// }

// export default new User();
