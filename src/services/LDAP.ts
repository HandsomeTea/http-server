import ldap, { Client, SearchOptions } from 'ldapjs';
// import ldap, { Client, ClientOptions, SearchOptions, EqualityFilter, SearchEntry } from 'ldapjs';
import { log } from '@/configs';
// import { _LdapSettingsDal } from '@/dal';

// interface LdapSearchData {
//     key: string
//     data: Array<string>
// }

// type LdapSearchResult = Array<LdapSearchData>;

// // export default
// class _LDAP {
//     private tenantId: string;
//     public client: Client | null;
//     /** 服务器 */
//     public host: string;
//     /** LDAP 端口 */
//     public port: number;
//     /** 超时（ms） */
//     private timeout: number;
//     /** 连接超时（ms） */
//     private connectTimeout: number;
//     /** 空闲超时（ms） */
//     private idleTimeout: number;
//     /** 拒绝未授权：禁用此选项以允许无法验证的证书。通常，自签名证书将要求禁用此选项才能工作 */
//     private rejectUnauthorized: boolean;
//     /** CA 证书 */
//     public CAcert: string;
//     /** 加密方法：不使用加密，SSL/LDAPS（全程启用加密）和StartTLS（建立连接后启用加密） */
//     public encryption: 'plain' | 'tls' | 'ssl';
//     /** 过滤器 */
//     public userSearchFilter: string;
//     /** 唯一识别字段 */
//     public uniqueIdentifierField: string;
//     /** 基准 DN */
//     public baseDN: string;
//     /** 范围 */
//     public userSearchScope: 'base' | 'one' | 'sub';
//     /** 搜索页面大小：每个结果页面的最大条目数将返回进行处理 */
//     public searchPageSize: number;
//     /** 启用 LDAP 用户组过滤 */
//     public groupFilterEnabled: boolean;
//     /** 组 */
//     public groupFilterObjectClass: string;
//     /** 组成员属性 */
//     public groupFilterGroupMemberAttribute: string;
//     /** 组成员格式 */
//     public groupFilterGroupMemberFormat: string;
//     /** 组ID属性，例如： * OpenLDAP的：* CN */
//     public groupFilterGroupIdAttribute: string;
//     /** 团队名字 */
//     public groupFilterGroupName: string;
//     /** 登录后找到用户：绑定后将执行用户DN的搜索，以确保绑定成功，从而防止在AD配置允许的情况下使用空密码进行登录。 */
//     private findUserAfterLogin: boolean;

//     constructor(tenantId: string) {
//         this.tenantId = tenantId;
//         this.client = null;
//         this.host = '';
//         this.port = 389;
//         this.timeout = 60 * 1000;
//         this.connectTimeout = 1 * 1000;
//         this.idleTimeout = 1 * 1000;
//         this.rejectUnauthorized = true;
//         this.CAcert = '';
//         this.encryption = 'plain';
//         this.userSearchFilter = '(objectclass=*)';
//         this.uniqueIdentifierField = 'objectGUID,ibm-entryUUID,GUID,dominoUNID,nsuniqueId,uidNumber';
//         this.baseDN = '';
//         this.userSearchScope = 'sub';
//         this.searchPageSize = 250;
//         this.groupFilterEnabled = false;
//         this.groupFilterObjectClass = 'groupOfUniqueNames';
//         this.groupFilterGroupMemberAttribute = 'uniqueMember';
//         this.groupFilterGroupMemberFormat = 'uniqueMember';
//         this.groupFilterGroupIdAttribute = 'cn';
//         this.groupFilterGroupName = '';
//         this.findUserAfterLogin = true;

//         this.init();
//     }

//     async init() {
//         log().debug(this.tenantId);
//         // const LdapSettings = new _LdapSettingsDal(this.tenantId);
//         // const setting = await LdapSettings.getConfig();

//         // if (setting) {
//         //     this.host = setting.host;
//         //     this.port = setting.port;
//         //     this.CAcert = setting.CAcert || '';
//         //     this.encryption = setting.encryption;
//         //     this.userSearchFilter = setting.host;
//         //     this.uniqueIdentifierField = setting.host;
//         //     this.baseDN = setting.baseDN;
//         //     this.userSearchScope = setting.userSearchScope;
//         //     this.groupFilterEnabled = Boolean(setting.groupFilterEnabled);
//         //     this.groupFilterObjectClass = setting.groupFilterObjectClass;
//         //     this.groupFilterGroupMemberAttribute = setting.groupFilterGroupMemberAttribute;
//         //     this.groupFilterGroupMemberFormat = setting.groupFilterGroupMemberFormat;
//         //     this.groupFilterGroupIdAttribute = setting.groupFilterGroupIdAttribute;
//         //     this.groupFilterGroupName = setting.groupFilterGroupName;
//         this.host = 'rwdc.bj.sensetime.com';
//         // this.port = setting.port;
//         // this.CAcert = setting.CAcert || '';
//         // this.encryption = setting.encryption;
//         // this.userSearchFilter = setting.host;
//         // this.uniqueIdentifierField = setting.host;
//         this.baseDN = 'OU=people,DC=domain,DC=sensetime,DC=com';
//         // this.userSearchScope = '';
//         // this.groupFilterEnabled = Boolean(setting.groupFilterEnabled);
//         // this.groupFilterObjectClass = setting.groupFilterObjectClass;
//         // this.groupFilterGroupMemberAttribute = setting.groupFilterGroupMemberAttribute;
//         // this.groupFilterGroupMemberFormat = setting.groupFilterGroupMemberFormat;
//         // this.groupFilterGroupIdAttribute = setting.groupFilterGroupIdAttribute;
//         // this.groupFilterGroupName = setting.groupFilterGroupName;

//         await this.connect();
//         // }
//     }

//     /** 链接ldap服务器 */
//     async connect(): Promise<void> {
//         const connectionOptions: ClientOptions = {
//             url: `${this.host}:${this.port}`,
//             timeout: this.timeout,
//             connectTimeout: this.connectTimeout,
//             idleTimeout: this.idleTimeout
//         };
//         const tlsOptions: {
//             rejectUnauthorized: boolean
//             ca?: Array<string>
//             host?: string
//         } = {
//             rejectUnauthorized: this.rejectUnauthorized
//         };

//         if (this.CAcert) {
//             const chainLines = this.CAcert.split('\n');
//             let cert: Array<string> = [];
//             const ca: Array<string> = [];

//             chainLines.forEach(line => {
//                 cert.push(line);
//                 if (line.match(/-END CERTIFICATE-/)) {
//                     ca.push(cert.join('\n'));
//                     cert = [];
//                 }
//             });
//             tlsOptions.ca = ca;
//         }

//         if (this.encryption === 'ssl') {
//             connectionOptions.url = `ldaps://${connectionOptions.url}`;
//             connectionOptions.tlsOptions = tlsOptions;
//         } else {
//             connectionOptions.url = `ldap://${connectionOptions.url}`;
//         }

//         log('ldap-connection').info(`Connecting at ${connectionOptions.url}`);
//         log('ldap-connection-options').debug(connectionOptions);

//         this.client = ldap.createClient(connectionOptions);

//         // 产生错误
//         this.client.on('error', error => {
//             log('ldap-connection-error').error(error);
//             Promise.reject(error);
//         });

//         // 服务器拒绝连接
//         this.client.on('connectRefused', error => {
//             log('ldap-connection-refused').error(error);
//         });

//         // 连接超时
//         this.client.on('connectTimeout', error => {
//             log('ldap-connection-timeout').error(error);
//         });

//         // 连接已建立
//         if (this.encryption !== 'tls') {
//             this.client.on('connect', response => {
//                 log('ldap-connection').info('LDAP connected');
//                 this.searchUsers('liuhaifeng');
//                 Promise.resolve(response);
//             });
//         } else {
//             // 尝试通过STARTTLS保护现有LDAP连接。
//             tlsOptions.host = this.host;

//             log('ldap-connection').info('Starting TLS');
//             log('ldap-connection-tls-options').debug(tlsOptions);

//             this.client.starttls(tlsOptions, null, (error: Error | null, response) => {
//                 if (error) {
//                     log('ldap-connection-tls').error(error);
//                     Promise.reject(error);
//                     return;
//                 }

//                 log('ldap-connection').info('TLS connected');
//                 Promise.resolve(response);
//             });
//         }

//         // 达到空闲超时
//         this.client.on('idle', () => {
//             log('ldap-search').info('Idle');
//             this.disconnect();
//         });

//         // socket连接断开
//         this.client.on('close', () => {
//             log('ldap-search').info('Closed');
//         });
//     }

//     /** 解析用户配置的搜索条件 */
//     getUserFilter(username: string): string {
//         const filter: Array<string> = [];

//         if (this.userSearchFilter !== '') {
//             if (this.userSearchFilter[0] === '(') {
//                 filter.push(`${this.userSearchFilter}`);
//             } else {
//                 filter.push(`(${this.userSearchFilter})`);
//             }
//         }

//         const usernameFilter = this.userSearchFilter.split(',').map((item) => `(${item}=${username})`);

//         if (usernameFilter.length === 0) {
//             log('ldap-get-user-search-filed').error('LDAP_User_Search_Field not defined');
//         } else if (usernameFilter.length === 1) {
//             filter.push(`${usernameFilter[0]}`);
//         } else {
//             filter.push(`(|${usernameFilter.join('')})`);
//         }

//         return `(&${filter.join('')})`;
//     }

//     async searchUsers(username: string/*, page*/): Promise<LdapSearchResult> {
//         const searchOptions: SearchOptions = {
//             filter: this.getUserFilter(username),
//             scope: this.userSearchScope
//             // sizeLimit: this.searchSizeLimit
//         };

//         if (this.searchPageSize > 0) {
//             searchOptions.paged = {
//                 pageSize: this.searchPageSize
//                 // pagePause: !!page
//             };
//         }

//         log('ldap-search-user').info(`Searching user ${username} at DN: ${this.baseDN}`);
//         log('ldap-search-user-options').debug(searchOptions);

//         // if (page) {
//         //     return await this.searchAllPaged(this.baseDN, searchOptions, page);
//         // }

//         return await this.searchAll(this.baseDN, searchOptions);
//     }

//     async getUserById(id: string, attribute: string): Promise<LdapSearchData | undefined> {
//         let filter: EqualityFilter | null = null;

//         if (attribute) {
//             filter = new ldap.EqualityFilter({
//                 attribute,
//                 value: Buffer.from(id, 'hex')
//             });
//         } else {
//             const filters: Array<EqualityFilter> = [];

//             this.uniqueIdentifierField.split(',').forEach(item => {
//                 filters.push(new ldap.EqualityFilter({
//                     attribute: item,
//                     value: Buffer.from(id, 'hex')
//                 }));
//             });

//             filter = new ldap.OrFilter({ filters });
//         }

//         const searchOptions = {
//             filter,
//             scope: 'sub' as 'base' | 'one' | 'sub'
//         };

//         log('ldap-search').info(`Searching by id ${id} at dn ${this.baseDN}`);
//         log('ldap-search').debug(`search filter ${searchOptions.filter.toString()}`);

//         const result = await this.searchAll(this.baseDN, searchOptions);

//         if (result.length > 1) {
//             log('ldap-search').error(`Search by id ${id} returned ${result.length} records.`);
//         }

//         return result[0];
//     }

//     async getUserByUsername(username: string): Promise<LdapSearchData | undefined> {
//         const searchOptions = {
//             filter: this.getUserFilter(username),
//             scope: this.userSearchScope
//         };

//         log('ldap-search').info(`Searching user by username: ${username} at dn: ${this.baseDN}`);
//         log('ldap-search').debug(searchOptions);

//         const result = await this.searchAll(this.baseDN, searchOptions);

//         if (result.length > 1) {
//             log('ldap-search').error(`Search by username ${username} returned ${result.length} records.`);
//         }

//         return result[0];
//     }

//     // ?
//     async isUserInGroup(username: string, userdn: string): Promise<boolean> {
//         if (!this.groupFilterEnabled) {
//             return true;
//         }

//         const filter = ['(&'];

//         if (this.groupFilterObjectClass) {
//             filter.push(`(objectclass=${this.groupFilterObjectClass})`);
//         }

//         if (this.groupFilterGroupMemberAttribute) {
//             filter.push(`(${this.groupFilterGroupMemberAttribute}=${this.groupFilterGroupMemberFormat})`);
//         }

//         if (this.groupFilterGroupIdAttribute) {
//             filter.push(`(${this.groupFilterGroupIdAttribute}=${this.groupFilterGroupName})`);
//         }

//         filter.push(')');

//         const searchOptions = {
//             filter: filter.join('').replace(/#{username}/g, username).replace(/#{userdn}/g, userdn),
//             scope: 'sub' as 'base' | 'one' | 'sub'
//         };

//         log('ldap-search').debug(`Group filter LDAP: ${searchOptions.filter}`);

//         const result = await this.searchAll(this.baseDN, searchOptions);

//         return result.length > 0;
//     }

//     extractLdapSearchResult(entry: SearchEntry): LdapSearchResult {
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         // @ts-ignore
//         const data = entry.object;
//         const result: LdapSearchResult = [];

//         Object.keys(data).forEach(key => {
//             const value = data[key];

//             if (!['thumbnailPhoto', 'jpegPhoto'].includes(key)) {
//                 result.push({
//                     key,
//                     data: typeof value === 'string' ? [value] : value
//                 });
//             }
//         });

//         return result;
//     }

//     // searchAllPaged(BaseDN: string, options: SearchOptions, page: (error: Error | null, entries?: LdapSearchResult, handle?: { end: boolean, next: () => void }) => void): void {

//     //     const processPage = (params: { entries: LdapSearchResult, title: string, end: boolean, callback?: () => void }) => {
//     //         const { entries, title, end, callback } = params;

//     //         log('ldap-search').info(title);
//     //         // Force LDAP idle to wait the record processing
//     //         page(null, entries, {
//     //             end,
//     //             next: () => {
//     //                 if (callback) {
//     //                     callback();
//     //                 }
//     //             }
//     //         });
//     //     };

//     //     this.client?.search(BaseDN, options, (error, res) => {
//     //         if (error) {
//     //             log('ldap-search').error(error);
//     //             page(error);
//     //             return;
//     //         }

//     //         res.on('error', (error) => {
//     //             log('ldap-search').error(error);
//     //             page(error);
//     //         });

//     //         let entries: LdapSearchResult = [];

//     //         const internalPageSize = options.paged && typeof options.paged !== 'boolean' && options.paged.pageSize && options.paged.pageSize > 0 ? options.paged.pageSize * 2 : 500;

//     //         res.on('searchEntry', (entry) => {
//     //             entries.concat(this.extractLdapSearchResult(entry));

//     //             if (entries.length >= internalPageSize) {
//     //                 processPage({
//     //                     entries,
//     //                     title: 'Internal Page',
//     //                     end: false
//     //                 });
//     //                 entries = [];
//     //             }
//     //         });

//     //         res.on('page', (_result, next: () => void) => {
//     //             if (!next) {
//     //                 processPage({
//     //                     entries,
//     //                     title: 'Final Page',
//     //                     end: true
//     //                 });
//     //             } else if (entries.length) {
//     //                 log('ldap-search').info('Page');
//     //                 processPage({
//     //                     entries,
//     //                     title: 'Page',
//     //                     end: false,
//     //                     callback: next
//     //                 });
//     //                 entries = [];
//     //             }
//     //         });

//     //         res.on('end', () => {
//     //             if (entries.length) {
//     //                 processPage({
//     //                     entries,
//     //                     title: 'Final Page',
//     //                     end: true
//     //                 });
//     //                 entries = [];
//     //             }
//     //         });
//     //     });
//     // }

//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     async searchAll(baseDN: string, options: SearchOptions): Promise<LdapSearchResult> {
//         this.client?.search(baseDN, options, (error, res) => {
//             if (error) {
//                 log('ldap-search').error(error);
//                 Promise.reject(error);
//             }

//             res.on('error', error => {
//                 log('ldap-search').error(error);
//                 Promise.reject(error);
//             });

//             const entries: LdapSearchResult = [];

//             res.on('searchEntry', entry => {
//                 entries.concat(this.extractLdapSearchResult(entry));
//             });

//             res.on('end', (result) => {
//                 log('ldap-search-result').info(result);
//                 Promise.resolve(entries);
//             });
//         });
//     }

//     async auth(dn: string): Promise<boolean> {
//         log('ldap-auth').info(`Authenticating at ${dn}.`);

//         try {
//             if (this.findUserAfterLogin) {
//                 const result = await this.searchAll(dn, { scope: this.userSearchScope });

//                 return result.length > 0;
//             }
//             return true;
//         } catch (error) {
//             log('ldap-auth').error(error);
//             return false;
//         }
//     }

//     disconnect(): void {
//         log('ldap-connection').info('Disconecting');
//         this.client?.unbind();
//     }
// }


export default class LDAP {
    public client: Client | null = null;
    public url: string = '';
    public authUserDN: string = '';
    public authUserPassword: string = '';
    public baseDN: string = '';
    public searchDN = '';
    public searchScope: 'base' | 'one' | 'sub' = 'sub';
    public searchTimeout: number = 500;
    public searchAttributes: string | Array<string> = '*';
    public seatchObjectClass: string = ''


    constructor() {
        // this.init()
    }

    async init() {
        this.url = 'ldap://rwdc.bj.sensetime.com';
        this.authUserDN = 'cn=xxx,ou=people,dc=domain,dc=sensetime,dc=com'; // ldap认证用户
        this.authUserPassword = 'xxx'; // ldap认证用户密码
        this.baseDN = 'dc=domain,dc=sensetime,dc=com';
        this.searchDN = `ou=people,${this.baseDN}`;
        this.searchScope = 'sub';
        this.seatchObjectClass = 'objectclass=person'; // 只搜索人

        await this.connect();
        // this.searchUser('username')
    }

    async connect(): Promise<void> {
        this.client = await new Promise((resolve, reject) => {
            const client = ldap.createClient({
                url: this.url
            }).on('error', error => {
                reject(error);
            }).on('connect', () => {
                log('ldap-connection').info(`connecting at ${this.url} success and ready to use`);
                resolve(client);
            });
        });
    }

    private async bind(): Promise<void> {
        await new Promise((resolve, reject) => {
            this.client?.bind(this.authUserDN, this.authUserPassword, (error, res) => {
                if (error) {
                    reject(error);
                }
                resolve(res);
            })
        });
    }

    getSearchData(entry: ldap.SearchEntry) {
        const result: Record<string, Array<string> | string> = {};

        for (const a of entry.attributes) {
            if (typeof a.values !== 'string' && a.values.length === 1) {
                result[a.type] = a.values[0];
            } else {
                result[a.type] = a.values;
            }
        }

        return result;
    }

    private async search(baseDN: string, options: SearchOptions): Promise<Array<ReturnType<typeof this.getSearchData>>> {
        await this.bind();

        const search: ldap.SearchCallbackResponse = await new Promise((resolve, reject) => {
            this.client?.search(baseDN, options, (error, res) => {
                if (error) {
                    reject(error);
                }
                resolve(res);
            });
        });

        return await new Promise((resolve, reject) => {
            const result: Array<ReturnType<typeof this.getSearchData>> = [];

            search
                .on('searchEntry', entry => {
                    result.push(this.getSearchData(entry));
                })
                .on('error', error => {
                    this.client?.unbind();
                    reject(error);
                }).on('end', () => {
                    this.client?.unbind();
                    resolve(result);
                });
        });
    }

    async searchUser(cn: string) {
        return await this.search(this.searchDN, {
            filter: `(&(|(cn=${cn})(mail=${cn}@sensetime.com))(${this.seatchObjectClass}))`,
            scope: this.searchScope,
            timeLimit: this.searchTimeout,
            attributes: this.searchAttributes
        });
    }

    async searchAll() {
        return await this.search(this.baseDN, {
            filter: `(${this.seatchObjectClass})`,
            scope: this.searchScope,
            timeLimit: this.searchTimeout,
            paged: true
        });
    }
}
