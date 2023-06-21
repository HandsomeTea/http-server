import { errorType, getENV } from '@/configs';
import jwt from 'jsonwebtoken';

export default new class JWT {
    private app: string;
    private appId: string;
    private appSecert: string;
    constructor() {
        this.app = getENV('JWT_APP_NAME') || '';
        this.appId = getENV('JWT_APP_ID') || '';
        this.appSecert = getENV('JWT_APP_SECERT') || '';
    }

    /**
     * 生成JWT
     * 一般携带在http请求headers的Authorization字段中
     * @returns
     * @memberof JWT
     */
    sign() {
        return 'JWT ' + jwt.sign({ iss: this.app, sub: this.appId }, this.appSecert, {
            expiresIn: '1m', // 有效期 60秒
            noTimestamp: true,
            header: {
                alg: 'HS256',
                typ: 'JWT'
            }
        });
    }

    /**
     * 验证JWT
     */
    verify(jsonWebToken: string) {
        try {
            jwt.verify(jsonWebToken, this.appSecert, {
                issuer: this.app,
                subject: this.appId,
                algorithms: ['HS256']
            });
        } catch (err) {
            throw new Exception(err as Error, errorType.UNAUTHORIZED);
        }
    }
};
