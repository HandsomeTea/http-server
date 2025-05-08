import { Request, Response, NextFunction } from 'express';

import { getENV, trace } from '@/configs';

/**
 * 捕捉路由中未处理的错误，即直接throw new Error的情况
 */
export default (err: ExceptionInstance, req: Request, res: Response, _next: NextFunction) => { /* eslint-disable-line*/
	const { status, code, message, reason, source } = err;
	const result: ExceptionInstance = {
		message,
		source: source && Array.isArray(source) && !source.includes(getENV('SERVER_NAME') || '') ? source.concat(getENV('SERVER_NAME') || '') : source,
		code: code || 'INTERNAL_SERVER_ERROR',
		status,
		reason: reason || []
	};

	trace('http-error').error(err);
	trace('http-response').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(result, null, '   ')}`);

	res.status(status || 500).send(result);
};
