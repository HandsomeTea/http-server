import { Request, Response, NextFunction } from 'express';
import { JWT } from '@/services';
import { errorType } from '@/configs';

/**
 * 验证来访服务器身份
 */
export default (req: Request, _res: Response, next: NextFunction): void => {
    if (req.headers.authorization) {
        const [authType, authToken] = req.headers.authorization.split(' ');

        if (authType !== 'JWT') {
            throw new Exception('Bad request(wrong Authorization)! Refused.', errorType.BAD_REQUEST);
        } else {
            JWT.verify(authToken);
            next();
        }
    } else {
        throw new Exception('Bad request(no Authorization)! Refused.', errorType.BAD_REQUEST);
    }
};
