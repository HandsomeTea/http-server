import { Request, Response, NextFunction } from 'express';
import { JWT } from '../service';
import { errorType } from '../configs/http.error.type';

/**
 * 验证json web token
 */
export default (req: Request, res: Response, next: NextFunction): void => {
    if (req.headers.authorization) {
        const [authType, authToken] = req.headers.authorization.split(' ');

        if (authType !== 'JWT') {
            res.status(400).send('Bad request(wrong Authorization)! Refused.');
        } else {
            JWT.verify(authToken);
            next();
        }
    } else {
        res.status(400).send({
            code: 400,
            type: errorType.BAD_REQUEST,
            error: {
                info: 'Bad request(no Authorization)! Refused.',
                reason: [],
                source: [process.env.SERVER_NAME]
            }
        });
    }
};
