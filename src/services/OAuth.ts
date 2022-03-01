import { getENV, errorType, log } from '@/configs';
// import { isURL } from '@/utils';
import HTTP from '@/services/HTTP';

class FormatIdentityResult {
    private oauthType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private identity: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(oauthType: string, identity: Record<string, any>) {
        this.oauthType = oauthType;
        this.identity = identity;

        this.init();
    }

    private init() {
        if (this.identity.result) {
            this.identity = this.identity.result;
        }
    }

    private get usernameField() {
        if (this.oauthType === 'github') {
            return 'login';
        }

        if (this.oauthType === 'deepin') {
            return 'username';
        }

        return undefined;
    }

    private get nameField() {
        if (this.oauthType === 'github') {
            return 'name';
        }

        if (this.oauthType === 'deepin') {
            return 'nickname';
        }

        return undefined;
    }

    private get phoneField() {
        if (this.oauthType === 'deepin') {
            return 'phone_number';
        }

        return undefined;
    }

    private get avatarField() {
        if (this.oauthType === 'github') {
            return 'avatar_url';
        }

        if (this.oauthType === 'deepin') {
            return 'profile_image';
        }

        return undefined;
    }

    get id() {
        const identity = this.identity;

        return (identity.id
            || identity._id
            || identity.uid
            || identity.ID
            || identity.user_id
            || identity.CharacterID
            || identity.phid
            || identity.sub
            || identity.userid
            || identity.user?.userid_sec && identity.user.userid_sec[0]
            || identity.user?.userid || identity.user?.user_id
            || identity.metadata?.uid
            || identity.ocs?.data?.id) as string;
    }

    get email() {
        const identity = this.identity;

        return (identity.email
            || identity.user?.email || identity.user?.user_email
            || identity.ocs?.data?.email
            || Array.isArray(identity.emails) && identity.emails.length >= 1 && identity.emails[0].address) as string;
    }

    get phone() {
        if (this.phoneField) {
            return this.identity[this.phoneField] as string;
        }

        return undefined;
    }

    get name() {
        const identity = this.identity;

        return (this.nameField && identity[this.nameField]
            || identity.name
            || identity.username
            || identity.nickname
            || identity.CharacterName
            || identity.userName
            || identity.preferred_username
            || identity.fullName
            || identity.user?.name
            || identity.ocs?.data?.displayname) as string;
    }

    get username() {
        let username: null | string = null;

        if (this.usernameField) {
            username = this.identity[this.usernameField];
        }

        if (!username) {
            throw new Exception(`Username field "${this.usernameField}" not found in identity`, errorType.INVALID_ARGUMENTS);
        }
        return username;
    }

    get avatarUrl() {
        let avatarUrl: null | string = null;

        if (this.avatarField) {
            avatarUrl = this.identity[this.avatarField];
        }

        if (!avatarUrl) {
            throw new Exception(`Avatar field "${this.avatarField}" not found in identity`, errorType.INVALID_ARGUMENTS);
        }

        return avatarUrl;
    }

    get result() {
        const _obj = {
            id: this.id,
            email: this.email,
            name: this.name,
            ...this.phoneField ? { phone: this.phone } : {},
            ...this.usernameField ? { username: this.username } : {},
            ...this.avatarField ? { avatarUrl: this.avatarUrl } : {}
        };

        return {
            ...this.identity,
            ..._obj
        };
    }
}

// 数据库中的配置
// interface OauthSettingModel {
//     _id: 'deepin'
//     clientId: string
//     secret: string
//     identityPath: string
//     tokenPath: string
//     tokenSentVia: 'payload' | 'header'
//     identityTokenSentVia: 'payload' | 'header'
//     accessTokenParam?: string
//     oauthServerURL?: string
//     scope: string
//     createdAt?: Date
//     _updatedAt?: Date
// }

export default class OauthService {
    public oauthType: string;
    public tenantId: string;
    private code: string;
    private state: string;
    private clientId: string;
    private secret: string;
    private identityPath: string;
    private tokenPath: string;
    private tokenSentVia: 'payload' | 'header';
    private identityTokenSentVia: 'payload' | 'header';
    private accessTokenParam?: string;
    private oauthServerURL: string;
    constructor(oauthType: string, tenantId: string, query: { code: string, state: string }) {
        this.oauthType = oauthType.toLowerCase();
        this.tenantId = tenantId;
        this.code = query.code;
        this.state = query.state;

        // those config from db
        this.clientId = '';
        this.secret = '';
        this.identityPath = 'https://api.github.com/user';
        this.tokenPath = 'login/oauth/access_token';
        this.tokenSentVia = 'payload';
        this.identityTokenSentVia = 'header';
        this.oauthServerURL = 'https://github.com';
        log().debug(this.oauthServerURL);
    }

    get redirectUri(): string {
        return `${getENV('ROOT_URL')}/oauth/${this.oauthType}/${this.tenantId}`;
    }

    async init() {
        // eslint-disable-next-line no-undef
        // const _config = await new _OauthSettingsDal(this.tenantId).findById(this.oauthType) as OauthSettingModel;

        // if (!_config) {
        //     throw new Exception('no match oauth config.', errorType.INVALID_ARGUMENTS);
        // }

        // this.clientId = _config.clientId;
        // this.secret = _config.secret;
        // this.identityPath = _config.identityPath;
        // this.tokenPath = _config.tokenPath;
        // this.tokenSentVia = _config.tokenSentVia;
        // this.identityTokenSentVia = _config.identityTokenSentVia;
        // this.accessTokenParam = _config.accessTokenParam;
        // if (_config.oauthServerURL) {
        //     this.oauthServerURL = _config.oauthServerURL;
        // }

        // if (!isURL(this.identityPath)) {
        //     this.identityPath = `${this.oauthServerURL}${this.identityPath}`;
        // }

        // if (!isURL(this.tokenPath)) {
        //     this.tokenPath = `${this.oauthServerURL}${this.tokenPath}`;
        // }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async getOAuthAccess(): Promise<any> {
        const allOptions: { headers: Record<string, string>, params: Record<string, string>, auth?: string } = {
            headers: {
                'User-Agent': 'Surpass',
                Accept: 'application/json'
            },
            params: {
                grant_type: 'authorization_code', /* eslint-disable-line camelcase */
                state: this.state,
                code: this.code,
                redirect_uri: this.redirectUri /* eslint-disable-line camelcase */
            }
        };

        if (this.tokenSentVia === 'header') {
            allOptions.auth = `${this.clientId}:${this.secret}`;
        } else {
            allOptions.params.client_secret = this.secret; /* eslint-disable-line camelcase */
            allOptions.params.client_id = this.clientId; /* eslint-disable-line camelcase */
        }

        try {
            const data = await HTTP.send(this.tokenPath, 'post', undefined, allOptions);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            if (data.error) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                throw new Exception(data.error, errorType.GET_OAUTH_ACCESS_TOKEN_ERROR);
            }
            return data;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw new Exception(error, errorType.GET_OAUTH_ACCESS_TOKEN_ERROR);
        }
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async getOAuthUser() {
        const response = await this.getOAuthAccess();

        return {
            ...await this.getIdentity(response.access_token),
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            expiresAt: +new Date() + 1000 * parseInt(response.expires_in || 10, 10)
        };
    }

    private async getIdentity(accessToken: string) {
        const params: Record<string, string> = {};
        const headers: Record<string, string> = {
            'User-Agent': 'Surpass',
            Accept: 'application/json'
        };

        if (this.identityTokenSentVia === 'header') {
            headers.Authorization = `Bearer ${accessToken}`;
        } else {
            if (this.accessTokenParam) {
                params[this.accessTokenParam] = accessToken;
            }
        }

        try {
            const data = await HTTP.send(this.identityPath, 'get', undefined, {
                headers,
                params
            });

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            if (data.error) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                throw new Exception(data.error, errorType.GET_OAUTH_IDENTITY_ERROR);
            }
            return new FormatIdentityResult(this.oauthType, data).result;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw new Exception(error, errorType.GET_OAUTH_IDENTITY_ERROR);
        }
    }
}
