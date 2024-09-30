import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { JWT } from '@/services';
import { ErrorCode } from '@/configs';

/**
 * 验证来访服务器身份
 */
export default asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
	if (req.headers.authorization) {
		const [authType, authToken] = req.headers.authorization.split(' ');

		if (authType !== 'Bearer') {
			throw new Exception('Bad request(wrong Authorization)! Refused.', ErrorCode.BAD_REQUEST);
		} else {
			JWT.verify(authToken);
			next();
		}
	} else {
		throw new Exception('Bad request(no Authorization)! Refused.', ErrorCode.BAD_REQUEST);
	}
});
