import { getENV, errorType, log } from '@/configs';
// import { isURL } from '@/utils';
// import { _OauthSettings } from '@/dal';
import HTTP from '@/services/HTTP';

// interface OauthAuthorizeArgument {
//     clientIdKey?: string
//     clientIdValue?: string
//     redirectUriKey?: string
//     responseTypeKey?: string
//     responseTypeValue?: string
//     scopeKey?: string
//     scopeValue?: string
//     stateKey?: string
//     key?: string
//     value?: string
// }

interface OauthGetTokenArgument {
    grantTypeKey?: string
    grantTypeValue?: string
    clientIdKey?: string
    clientIdValue?: string
    clientSecretKey?: string
    clientSecretValue?: string
    codeKey?: string
    stateKey?: string
    redirectUriKey?: string
    auth?: string
    key?: string
    value?: string
    position: 'header' | 'query' | 'data' | 'auth'
}

interface OauthGetUserArgument {
    tokenKey?: string
    refreshTokenKey?: string
    tokenExpiresKey?: string
    Authorization?: string
    key?: string
    value?: string
    position: 'header' | 'query' | 'data'
}

interface AccessTokenInfo {
    accessToken: string
    refreshToken?: string
    expiresIn?: number
}

interface OauthUserInfoFormation {
    name: string
    username: string
    email: string
    userId?: string
    phone?: string
    departmentName?: string
    avatar?: string
    firstName?: string
    lastName?: string
    position?: string
    location?: string
}

// interface OauthSettingModel {
//     _id: string
//     oauthServerURL: string
//     authorizeApi: string
//     authorizeApiParamsFormationJson: string
//     authorizeApiResponseFormationJson: string
//     tokenApi: string
//     tokenApiMethod: 'post' | 'get'
//     tokenApiParamsFormationJson: string
//     tokenApiResponseFormationJson: string
//     userApi: string
//     userApiMethod: 'post' | 'get'
//     userApiParamsFormationJson: string
//     userApiResponseFormationJson: string
//     noDepartmentDeal: 'as-root' | 'refused' | 'create-belong'
//     createdAt?: Date
//     updatedAt?: Date
// }


export default class OauthService {
    public oauthType: string;
    public tenantId: string;
    private code: string;
    private state: string;

    private oauthServerURL: string;
    private tokenApi: string;
    private tokenApiMethod: 'post' | 'get';
    private tokenApiParamsFormation: Array<OauthGetTokenArgument>;
    private tokenApiResponseFormation: { accessTokenKey: string, refreshTokenKey?: string, expiresKey?: string };
    private userApi: string;
    private userApiMethod: 'post' | 'get';
    private userApiParamsFormation: Array<OauthGetUserArgument>;
    private userApiResponseFormation: OauthUserInfoFormation;
    constructor(oauthType: string, tenantId: string, query: { code: string, state: string }) {
        this.oauthType = oauthType;
        this.tenantId = tenantId;
        this.code = query.code;
        this.state = query.state;

        this.oauthServerURL = '';
        log().debug(this.oauthServerURL);

        this.tokenApi = '';
        this.tokenApiMethod = 'post';
        this.tokenApiParamsFormation = [{
            grantTypeKey: 'grant_type',
            grantTypeValue: 'authorization_code',
            position: 'query'
        }, {
            clientIdKey: 'client_id',
            clientIdValue: '',
            position: 'query'
        }, {
            clientSecretKey: 'client_secret',
            clientSecretValue: '',
            position: 'query'
        }, {
            codeKey: 'code',
            position: 'query'
        }, {
            stateKey: 'state',
            position: 'query'
        }, {
            redirectUriKey: 'redirect_uri',
            position: 'query'
        }];
        this.tokenApiResponseFormation = {
            accessTokenKey: 'access_token',
            refreshTokenKey: 'refresh_token',
            expiresKey: 'expires_in'
        };
        this.userApi = '';
        this.userApiMethod = 'get';
        this.userApiParamsFormation = [{ tokenKey: 'access_token', position: 'query' }];
        this.userApiResponseFormation = {
            name: '',
            username: '',
            email: ''
        };
    }

    get redirectUri(): string {
        return `${getENV('ROOT_URL')}/api/surpasspub/usermanager/2.0/account/oauth/${this.oauthType}/tenant/${this.tenantId}/callback`;
    }

    async init() {
        // const _config = await new _OauthSettings(this.tenantId).findById(this.oauthType) as OauthSettingModel;

        // if (!_config) {
        //     throw new Exception('no match oauth config.', errorType.INVALID_ARGUMENTS);
        // }

        // this.tokenApi = _config.tokenApi;
        // this.tokenApiMethod = _config.tokenApiMethod;
        // this.tokenApiParamsFormation = JSON.parse(_config.tokenApiParamsFormationJson);
        // this.tokenApiResponseFormation = JSON.parse(_config.tokenApiResponseFormationJson);
        // this.userApi = _config.userApi;
        // this.userApiMethod = _config.userApiMethod;
        // this.userApiParamsFormation = JSON.parse(_config.userApiParamsFormationJson);
        // this.userApiResponseFormation = JSON.parse(_config.userApiResponseFormationJson);
        // if (_config.oauthServerURL) {
        //     this.oauthServerURL = _config.oauthServerURL;
        // }

        // if (!isURL(this.userApi)) {
        //     this.userApi = `${this.oauthServerURL}${this.userApi}`;
        // }

        // if (!isURL(this.tokenApi)) {
        //     this.tokenApi = `${this.oauthServerURL}${this.tokenApi}`;
        // }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private formatObjPathData(obj: Record<string, any>, path: string): any {
        const keyPath = path.split(',');
        let result = { ...obj };

        for (let s = 0; s < keyPath.length; s++) {
            if (!result[keyPath[s]]) {
                return null;
            }
            result = result[keyPath[s]];
        }
        return result;
    }

    private formatTokenApiParams() {
        const arg = [...this.tokenApiParamsFormation];
        let params: Record<string, string> = {};
        let data: Record<string, string> = {};
        let headers: Record<string, string> = {};
        let auth: null | string = null;

        for (let s = 0; s < arg.length; s++) {
            const result: Record<string, string> = {};
            const { position,
                grantTypeKey, grantTypeValue,
                clientIdKey, clientIdValue,
                clientSecretKey, clientSecretValue,
                codeKey, stateKey, redirectUriKey,
                key, value } = arg[s];

            if (grantTypeKey && grantTypeValue) {
                result[grantTypeKey] = grantTypeValue;
            } else if (clientIdKey && clientIdValue) {
                result[clientIdKey] = clientIdValue;
            } else if (clientSecretKey && clientSecretValue) {
                result[clientSecretKey] = clientSecretValue;
            } else if (codeKey) {
                result[codeKey] = this.code;
            } else if (stateKey) {
                result[stateKey] = this.state;
            } else if (redirectUriKey) {
                result[redirectUriKey] = this.redirectUri;
            } else if (arg[s].auth) {
                auth = arg[s].auth as string;
            } else if (key && value) {
                result[key] = value;
            }

            switch (position) {
                case 'data':
                    data = { ...data, ...result };
                    break;
                case 'header':
                    headers = { ...headers, ...result };
                    break;
                default:
                    params = { ...params, ...result };
            }
        }

        return { params, data, headers, auth };
    }

    private formatUserApiParams(token: AccessTokenInfo) {
        const arg = [...this.userApiParamsFormation];
        let params: Record<string, string> = {};
        let data: Record<string, string> = {};
        let headers: Record<string, string> = {};

        for (let s = 0; s < arg.length; s++) {
            const result: Record<string, string> = {};
            const { position,
                tokenKey, refreshTokenKey, tokenExpiresKey,
                Authorization,
                key, value } = arg[s];

            if (tokenKey) {
                result[tokenKey] = token.accessToken;
            } else if (refreshTokenKey && token.refreshToken) {
                result[refreshTokenKey] = token.refreshToken;
            } else if (tokenExpiresKey && token.expiresIn) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                result[tokenExpiresKey] = token.expiresIn;
            } else if (Authorization) {
                result['Authorization'] = 'has';
            } else if (key && value) {
                result[key] = value;
            }

            switch (position) {
                case 'data':
                    data = { ...data, ...result };
                    break;
                case 'header':
                    headers = { ...headers, ...result };
                    break;
                default:
                    params = { ...params, ...result };
            }
        }

        return { params, data, headers };
    }

    private async getAccessToken() {
        try {
            const { params, data, headers, auth } = this.formatTokenApiParams();
            const result = await HTTP.send(this.tokenApi, this.tokenApiMethod, undefined, {
                headers: {
                    'User-Agent': 'Surpass',
                    Accept: 'application/json',
                    ...headers
                },
                params,
                data,
                ...auth ? { auth } : {}
            });

            log('oauth-access-token-response').info(JSON.stringify(result, null, '   '));

            const { accessTokenKey, refreshTokenKey, expiresKey } = this.tokenApiResponseFormation;

            return {
                accessToken: this.formatObjPathData(result.data, accessTokenKey) as string,
                ...refreshTokenKey ? { refreshToken: this.formatObjPathData(result.data, refreshTokenKey) as string } : {},
                ...expiresKey ? { expiresIn: parseInt(this.formatObjPathData(result.data, expiresKey)) || 0 } : {}
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw new Exception(error, errorType.GET_OAUTH_ACCESS_TOKEN_ERROR);
        }
    }

    private async getUserInfo(tokenInfo: AccessTokenInfo) {
        const { params, data, headers } = this.formatUserApiParams(tokenInfo);

        try {
            const result = await HTTP.send(this.userApi, this.userApiMethod, undefined, {
                headers: {
                    'User-Agent': 'Surpass',
                    Accept: 'application/json',
                    ...headers,
                    ...headers.Authorization ? { Authorization: `Bearer ${tokenInfo.accessToken}` } : {}
                },
                params,
                data
            });

            log('oauth-user-response').info(JSON.stringify(result, null, '   '));

            const {
                userId, name, username, email, phone, departmentName, avatar,
                firstName, lastName, position, location
            } = { ...this.userApiResponseFormation };

            const _obj = {
                id: userId ? this.formatObjPathData(result, userId) : '',
                name: this.formatObjPathData(result, name),
                username: this.formatObjPathData(result, username),
                email: this.formatObjPathData(result, email),
                phone: phone ? this.formatObjPathData(result, phone) : undefined,
                departmentName: departmentName ? this.formatObjPathData(result, departmentName) : undefined,
                avatarUrl: avatar ? this.formatObjPathData(result, avatar) : undefined,
                firstName: firstName ? this.formatObjPathData(result, firstName) : undefined,
                lastName: lastName ? this.formatObjPathData(result, lastName) : undefined,
                position: position ? this.formatObjPathData(result, position) : undefined,
                location: location ? this.formatObjPathData(result, location) : undefined
            };

            if (!_obj.id || !_obj.username || !_obj.email) {
                throw new Exception(`can not get id or username or email in value is required in \n${JSON.stringify(result, null, '   ')}\nby formation: \n${JSON.stringify({ userId, username, email }, null, '   ')}`, errorType.GET_OAUTH_IDENTITY_ERROR);
            }

            return _obj;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw new Exception(error, errorType.GET_OAUTH_IDENTITY_ERROR);
        }
    }

    async oauthResult() {
        return await this.getUserInfo(await this.getAccessToken());
    }
}


// export default (setting: {
//     oauthType: string
//     oauthServerURL: string
//     authorizeApi: string
//     authorizeApiParamsFormation: Array<OauthAuthorizeArgument>
//     authorizeApiResponseFormation: { codeKey: string, stateKey: string }
//     tokenApi: string
//     tokenApiMethod: 'post' | 'get'
//     tokenApiParamsFormation: Array<OauthGetTokenArgument>
//     tokenApiResponseFormation: { accessTokenKey: string, refreshTokenKey?: string, expiresKey?: string }
//     userApi: string
//     userApiMethod: 'post' | 'get'
//     userApiParamsFormation: Array<OauthGetUserArgument>
//     userApiResponseFormation: SamlUserInfoFormation
//     noDepartmentDeal: 'as-root' | 'refused' | 'create-belong'
// }): OauthSettingModel => {
//     const {
//         oauthType, oauthServerURL,
//         authorizeApi, authorizeApiParamsFormation, authorizeApiResponseFormation,
//         tokenApi, tokenApiMethod, tokenApiParamsFormation, tokenApiResponseFormation,
//         userApi, userApiMethod, userApiParamsFormation, userApiResponseFormation,
//         noDepartmentDeal } = setting;

//     check(oauthType, String, false);

//     if (!tokenApi) {
//         throw new Exception('tokenApi is required!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!userApi) {
//         throw new Exception('userApi is required!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!authorizeApi) {
//         throw new Exception('authorizeApi is required!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!oauthServerURL && (!isURL(tokenApi) || !isURL(userApi) || !isURL(authorizeApi))) {
//         throw new Exception('oauthServerURL is required!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!tokenApiMethod) {
//         throw new Exception('tokenApiMethod is required!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!userApiMethod) {
//         throw new Exception('userApiMethod is required!', errorType.INVALID_ARGUMENTS);
//     }
//     const method = new Set(['post', 'get']);

//     if (!method.has(tokenApiMethod)) {
//         throw new Exception('tokenApiMethod is invalid!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!method.has(userApiMethod)) {
//         throw new Exception('userApiMethod is invalid!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!new Set(['as-root', 'refused', 'create-belong']).has(noDepartmentDeal)) {
//         throw new Exception('noDepartmentDeal is invalid!', errorType.INVALID_ARGUMENTS);
//     }

//     // 授权链接参数解析
//     const authorizeParams: OauthAuthorizeArgument = {};

//     for (let s = 0; s < authorizeApiParamsFormation.length; s++) {
//         if (Object.keys(authorizeApiParamsFormation[s]).length > 2) {
//             throw new Exception(`can not set config more than one in ${JSON.stringify(authorizeApiParamsFormation[s])}`, errorType.INVALID_ARGUMENTS);
//         }

//         const {
//             clientIdKey, clientIdValue,
//             redirectUriKey,
//             responseTypeKey, responseTypeValue,
//             scopeKey, scopeValue,
//             stateKey
//         } = authorizeApiParamsFormation[s];

//         if (clientIdKey && clientIdValue) {
//             authorizeParams.clientIdKey = clientIdKey;
//             authorizeParams.clientIdValue = clientIdValue;
//         } else if (redirectUriKey) {
//             authorizeParams.redirectUriKey = redirectUriKey;
//         } else if (responseTypeKey && responseTypeValue) {
//             authorizeParams.responseTypeKey = responseTypeKey;
//             authorizeParams.responseTypeValue = responseTypeValue;
//         } else if (scopeKey && scopeValue) {
//             authorizeParams.scopeKey = scopeKey;
//             authorizeParams.scopeValue = scopeValue;
//         } else if (stateKey) {
//             authorizeParams.stateKey = stateKey;
//         }
//     }

//     if (!authorizeParams.clientIdKey || !authorizeParams.clientIdValue) {
//         throw new Exception('clientIdKey, clientIdValue is required in authorize api params!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!authorizeParams.redirectUriKey) {
//         throw new Exception('redirectUriKey is required in authorize api params!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!authorizeParams.responseTypeKey || !authorizeParams.responseTypeValue) {
//         throw new Exception('responseTypeKey, responseTypeValue is required in authorize api params!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!authorizeParams.stateKey) {
//         throw new Exception('stateKey is required in authorize api params!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!authorizeApiResponseFormation.codeKey || !authorizeApiResponseFormation.stateKey) {
//         throw new Exception('codeKey, stateKey is required in authorize api response params!', errorType.INVALID_ARGUMENTS);
//     }

//     // 获取token接口参数检查
//     const tokenParams: OauthGetTokenArgument = { position: 'data' };
//     const positionList1 = new Set(['header', 'query', 'data', 'auth']);

//     for (let s = 0; s < tokenApiParamsFormation.length; s++) {
//         if (Object.keys(tokenApiParamsFormation[s]).length > 3) {
//             throw new Exception(`can not set config more than one in ${JSON.stringify(tokenApiParamsFormation[s])}`, errorType.INVALID_ARGUMENTS);
//         }
//         const {
//             grantTypeKey, grantTypeValue,
//             clientIdKey, clientIdValue,
//             clientSecretKey, clientSecretValue,
//             codeKey, stateKey, redirectUriKey,
//             auth, position } = tokenApiParamsFormation[s];

//         if (!positionList1.has(position)) {
//             throw new Exception(`invalid position in ${JSON.stringify(tokenApiParamsFormation[s])}`, errorType.INVALID_ARGUMENTS);
//         }
//         if (grantTypeKey && grantTypeValue) {
//             tokenParams.grantTypeKey = grantTypeKey;
//             tokenParams.grantTypeValue = grantTypeValue;
//         } else if (clientIdKey && clientIdValue) {
//             tokenParams.clientIdKey = clientIdKey;
//             tokenParams.clientIdValue = clientIdValue;
//         } else if (clientSecretKey && clientSecretValue) {
//             tokenParams.clientSecretKey = clientSecretKey;
//             tokenParams.clientSecretValue = clientSecretValue;
//         } else if (codeKey) {
//             tokenParams.codeKey = codeKey;
//         } else if (stateKey) {
//             tokenParams.stateKey = stateKey;
//         } else if (redirectUriKey) {
//             tokenParams.redirectUriKey = redirectUriKey;
//         } else if (auth) {
//             tokenParams.auth = auth;
//             if (position !== 'auth') {
//                 throw new Exception(`invalid auth data: ${JSON.stringify(tokenApiParamsFormation[s])}, auth position must be auth!`, errorType.INVALID_ARGUMENTS);
//             }
//         }
//     }
//     if (!tokenParams.grantTypeKey || !tokenParams.grantTypeValue || !tokenParams.codeKey || !tokenParams.stateKey || !tokenParams.redirectUriKey) {
//         throw new Exception('grantTypeKey, grantTypeValue, codeKey, stateKey, redirectUriKey is required in token api params!', errorType.INVALID_ARGUMENTS);
//     }

//     if (tokenParams.auth) {
//         check(tokenParams.auth, String);
//     }

//     if ((!tokenParams.clientIdKey || !tokenParams.clientIdValue || !tokenParams.clientSecretKey || !tokenParams.clientSecretValue) && !tokenParams.auth) {
//         throw new Exception('clientId and clientSecret info is required in token api params!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!tokenApiResponseFormation.accessTokenKey) {
//         throw new Exception('accessTokenKey info is required!', errorType.INVALID_ARGUMENTS);
//     }

//     // 获取用户信息接口参数检查
//     const userParams: OauthGetUserArgument = { position: 'data' };
//     const positionList2 = new Set(['header', 'query', 'data']);

//     for (let s = 0; s < userApiParamsFormation.length; s++) {
//         if (Object.keys(userApiParamsFormation[s]).length > 3) {
//             throw new Exception(`can not set config more than one in ${JSON.stringify(userApiParamsFormation[s])}`, errorType.INVALID_ARGUMENTS);
//         }

//         const { tokenKey, Authorization, position } = userApiParamsFormation[s];

//         if (!positionList2.has(position)) {
//             throw new Exception(`invalid position in ${JSON.stringify(userApiParamsFormation[s])}`, errorType.INVALID_ARGUMENTS);
//         }

//         if (tokenKey) {
//             userParams.tokenKey = tokenKey;
//         } else if (Authorization) {
//             userParams.Authorization = Authorization;
//             if (position !== 'header') {
//                 throw new Exception(`invalid Authorization data: ${JSON.stringify(userApiParamsFormation[s])}, Authorization position must be header!`, errorType.INVALID_ARGUMENTS);
//             }
//         }
//     }
//     if (!userParams.tokenKey && !userParams.Authorization) {
//         throw new Exception('tokenKey info is required in get user info api params!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!userApiResponseFormation.email || !userApiResponseFormation.name || !userApiResponseFormation.username) {
//         throw new Exception('user info: [email, name, username] is required in userApiResponseFormation!', errorType.INVALID_ARGUMENTS);
//     }

//     return {
//         _id: oauthType,
//         oauthServerURL,
//         authorizeApi,
//         authorizeApiParamsFormationJson: JSON.stringify(authorizeApiParamsFormation),
//         authorizeApiResponseFormationJson: JSON.stringify(authorizeApiResponseFormation),
//         tokenApi,
//         tokenApiMethod,
//         tokenApiParamsFormationJson: JSON.stringify(tokenApiParamsFormation),
//         tokenApiResponseFormationJson: JSON.stringify(tokenApiResponseFormation),
//         userApi,
//         userApiMethod,
//         userApiParamsFormationJson: JSON.stringify(userApiParamsFormation),
//         userApiResponseFormationJson: JSON.stringify(userApiResponseFormation),
//         noDepartmentDeal
//     };
// };

/*
 * @apiParamExample {json} body-Example:
 * {
 *      oauthType: '', // 自定义oauth类型
 *      oauthServerURL: '', // oauth服务器地址
 *      authorizeApi: '', // oauth授权地址
 *      authorizeApiParamsFormation: [{ // oauth授权参数
 *          clientIdKey: '', // 应用id，默认client_id
 *          clientIdValue: '',
 *          redirectUriKey: '', // 回调(会畅)地址参数名称，默认redirect_uri
 *          responseTypeKey: '', // response type，默认response_type
 *          responseTypeValue: '',
 *          [scopeKey]: '', // scope，默认scope
 *          [scopeValue]: '',
 *          stateKey: '', // state，默认state
 *          [key]: '', // 其他参数名称
 *          [value]: '' // 其他参数值
 *      }],
 *      authorizeApiResponseFormation: { // oauth授权解析规范
 *          codeKey: '', // code所在字段
 *          stateKey: '' // state所在字段
 *      },
 *      tokenApi: '', // token获取地址
 *      tokenApiMethod: 'post' | 'get', // 默认get
 *      tokenApiParamsFormation: [{ // token获取访问参数
 *          [grantTypeKey]: '', // grant type，默认grant_type
 *          [grantTypeValue]: '', // 默认authorization_code
 *          [clientIdKey]: '', // 应用id，默认client_id
 *          [clientIdValue]: '',
 *          [clientSecretKey]: '', // 应用secret，默认client_secret
 *          [clientSecretValue]: '',
 *          [codeKey]: '', // code参数名称，默认code
 *          [stateKey]: '', // state参数名称，默认state
 *          [redirectUriKey]: '', // 回调(会畅)地址参数名称，默认redirect_uri
 *          [auth]: '', // 应用鉴权信息，该字段也是应用id和secret信息，所以clientIdKey，clientIdValue，clientSecretKey，clientSecretValue和auth二选一
 *          position: 'header' | 'query' | 'data'| 'auth', // api参数所在http请求的位置，auth字段如果有，则position必须为auth
 *          [key]: '', // 其他参数名称
 *          [value]: '' // 其他参数值
 *      }],
 *      tokenApiResponseFormation: { // token解析规范
 *          accessTokenKey: '', // token所在字段
 *          [refreshTokenKey]: '', // refresh token所在字段
 *          [expiresKey]: '' // token过期信息所在字段
 *      },
 *      userApi: '', // 用户信息获取地址
 *      userApiMethod: 'post' | 'get', // 默认post
 *      userApiParamsFormation: [{ // 用户信息访问参数
 *          [tokenKey]: '', // token参数名称
 *          [refreshTokenKey]: '', // refresh token参数名称
 *          [tokenExpiresKey]: '', // token过期参数名称
 *          [Authorization]: false, // 是否使用Bearer-token鉴权，如果该字段有，则position必须为header
 *          position: 'header' | 'query' | 'data', // api参数所在http请求的位置
 *          [key]: '', // 其他参数名称
 *          [value]: '' // 其他参数值
 *      }],
 *      userApiResponseFormation: { //用户信息解析规范
 *          name: '', // 姓名
 *          username: '',// 账号
 *          email: '',
 *          [departmentName]: '',
 *          [phone]: '',
 *          [userId]: '',
 *          [firstName]: '',
 *          [lastName]: '',
 *          [position]: '',
 *          [location]: '',
 *          [avatar]: ''
 *      },
 *      noDepartmentDeal: 'as-root' | 'refused' | 'create-belong',
 * }
 */

// const oauthConfig = await new _OauthSettingsDal(tenantId).find() as Array<OauthSettingModel>;

// if (oauthConfig.length > 0) {
//     _temp.oauth = {};
//     oauthConfig.map(i => {
//         if (_temp.oauth) {
//             const authorizeParams: Array<[string, string]> = [];
//             const authorizeApiParamsFormation = JSON.parse(i.authorizeApiParamsFormationJson) as Array<OauthAuthorizeArgument>;

//             for (let s = 0; s < authorizeApiParamsFormation.length; s++) {
//                 const {
//                     clientIdKey, clientIdValue,
//                     redirectUriKey,
//                     responseTypeKey, responseTypeValue,
//                     scopeKey, scopeValue,
//                     stateKey,
//                     key, value
//                 } = authorizeApiParamsFormation[s];

//                 if (clientIdKey && clientIdValue) {
//                     authorizeParams.push([clientIdKey, clientIdValue]);
//                 } else if (redirectUriKey) {
//                     authorizeParams.push([redirectUriKey, `${serverConfig.sgAddr}/${serverConfig.namespace}/api/surpasspub/usermanager/2.0/account/oauth/${i._id}/tenant/${tenantId}/callback`]);
//                 } else if (responseTypeKey && responseTypeValue) {
//                     authorizeParams.push([responseTypeKey, responseTypeValue]);
//                 } else if (scopeKey && scopeValue) {
//                     authorizeParams.push([scopeKey, scopeValue]);
//                 } else if (stateKey) {
//                     authorizeParams.push([stateKey, spanId]);
//                 } else if (key && value) {
//                     authorizeParams.push([key, value]);
//                 }
//             }
//             _temp.oauth[i._id] = `${i.oauthServerURL}?${authorizeParams.map(a => `${a[0]}=${a[1]}`).join('&')}`;
//         }
//     });
// }


/**
 * @api {get} /api/surpasspub/usermanager/2.0/account/oauth/:oauthType/tenant/:tenantId/callback oauth授权回调
 * @apiName oauth-redirectUrl
 * @apiGroup account-v2
 * @apiDescription 无验证
 * @apiVersion 2.0.0
 * @apiParam (params) {string} oauthType oauth类型，取值：deepin、gt
 * @apiParam (params) {string} tenantId tenantId，例如t2
 * @apiParam  (query) {string} code 回调的code
 * @apiParam  (query) {string} state 回调的state
 * @apiSuccess {String} html 一个html页面.
 */
// router.get('/oauth/:oauthType/tenant/:tenantId/callback', asyncHandler(async (req, res) => {
//     const { oauthType, tenantId } = req.params as { oauthType: string, tenantId: string };

//     check(tenantId, String, false);
//     check(oauthType, String, false);
//     const oauthConfig = await new _OauthSettingsDal(tenantId).findById(oauthType);

//     if (!oauthConfig) {
//         throw new Exception('invalid oauth type!', errorType.INVALID_ARGUMENTS);
//     }
//     const { codeKey, stateKey } = JSON.parse(oauthConfig.authorizeApiResponseFormationJson) as { codeKey: string, stateKey: string };
//     const code = req.query[codeKey] as undefined | string;
//     const state = req.query[stateKey] as undefined | string;

//     if (!code || !state) {
//         throw new Exception('code and state is required.', errorType.INVALID_ARGUMENTS);
//     }
//     const oauthServer = new OAuth(oauthType, tenantId, { code, state });

//     await oauthServer.init();
//     const serviceData = await oauthServer.oauthResult();
//     const credentialSecret = randomSecret();
//     const credentialToken = credentialTokenFromQuery(state);

//     // Store the login result so it can be retrieved in another browser tab by the result handler
//     await vendorTempService.storeOauthCredential(credentialToken, tenantId, oauthType, {
//         serviceData,
//         credentialSecret
//     });
//     const commandInfo = state.split('-');
//     const idMark = commandInfo[0];

//     // socket后端自动登录的逻辑
//     if (idMark === 'ws') {
//         await mqService.sendToWebSocketConnections([commandInfo[1]], {
//             event: 'trans_autonomic_action',
//             action: 'sso_login',
//             signal: 'SUCCESS',
//             type: 'oauth',
//             token: credentialToken,
//             secret: credentialSecret
//         });
//     }
//     vendorAuthPopup(res, {
//         type: 'Oauth',
//         credentialToken,
//         credentialSecret,
//         schema: idMark === 's' ? commandInfo[1] : undefined,
//         browserStore: idMark !== 's' && idMark !== 'ws'
//     });
// }));
