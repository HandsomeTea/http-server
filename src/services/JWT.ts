import jwt from 'jsonwebtoken';
import { ErrorCode, getENV } from '@/configs';

export default new class JWT {
    constructor() {
        this.init();
    }

    private init() {
        if (!this.secret) {
            throw new Exception('JWT secret is required!', ErrorCode.INTERNAL_SERVER_ERROR);
        }

        if (!this.jwtSubject || !this.jwtIssure) {
            throw new Exception('JWT source data is required!', ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private get jwtIssure() {
        return getENV('JWT_ISSURE');
    }

    private get jwtSubject() {
        return getENV('JWT_SUBJECT');
    }

    private get secret() {
        return getENV('JWT_SECRET') as string;
    }

    sign() {
        return 'JWT ' + jwt.sign({ iss: this.jwtIssure, sub: this.jwtSubject }, this.secret, {
            expiresIn: '1h',
            noTimestamp: true,
            header: {
                alg: 'HS256',
                typ: 'JWT'
            }
        });
    }

    verify(jsonWebToken: string) {
        try {
            jwt.verify(jsonWebToken, this.secret, {
                issuer: this.jwtIssure,
                subject: this.jwtSubject,
                algorithms: ['HS256']
            });
            return true;
        } catch (e) {
            throw new Exception(e as Error, ErrorCode.SERVER_REQUEST_UNAUTHORIZED);
        }
    }
};
