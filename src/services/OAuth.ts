import { getENV, errorType, log } from '@/configs';
// import { isURL } from '@/utils';
// import { _OauthSettings } from '@/dal';
import HTTP from '@/services/HTTP';

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
        this.oauthType = oauthType.toLowerCase();
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
        return `${getENV('ROOT_URL')}/oauth/${this.oauthType}/${this.tenantId}`;
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
                accessToken: this.formatObjPathData(result, accessTokenKey) as string,
                ...refreshTokenKey ? { refreshToken: this.formatObjPathData(result, refreshTokenKey) as string } : {},
                ...expiresKey ? { expiresIn: parseInt(this.formatObjPathData(result, expiresKey)) || 0 } : {}
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
//     tokenApi: string
//     tokenApiMethod: 'post' | 'get'
//     tokenApiParamsFormation: Array<OauthGetTokenArgument>
//     tokenApiResponseFormation: { accessTokenKey: string, refreshTokenKey?: string, expiresKey?: string }
//     userApi: string
//     userApiMethod: 'post' | 'get'
//     userApiParamsFormation: Array<OauthGetUserArgument>
//     userApiResponseFormation: SamlUserInfo
//     noDepartmentDeal: 'as-root' | 'refused' | 'create-belong'
// }): OauthSettingModel => {
//     const {
//         oauthType, oauthServerURL,
//         tokenApi, tokenApiMethod, tokenApiParamsFormation, tokenApiResponseFormation,
//         userApi, userApiMethod, userApiParamsFormation, userApiResponseFormation,
//         noDepartmentDeal } = setting;

//     check(oauthType, String, false);

//     if (!oauthServerURL && (!isURL(tokenApi) || !isURL(userApi))) {
//         throw new Exception('oauthServerURL is required!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!tokenApi) {
//         throw new Exception('tokenApi is required!', errorType.INVALID_ARGUMENTS);
//     }

//     if (!userApi) {
//         throw new Exception('userApi is required!', errorType.INVALID_ARGUMENTS);
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
//         _id: oauthType.toLowerCase(),
//         oauthServerURL,
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
 *      tokenApi: '', // token获取地址
 *      tokenApiMethod: 'post' | 'get', // 默认get
 *      tokenApiParamsFormation: [{ // token获取访问参数
 *          [grantTypeKey]: '', // grant type，默认grant_type
 *          [grantTypeValue]: '',
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
