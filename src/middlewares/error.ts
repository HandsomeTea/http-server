import { Request, Response, NextFunction } from 'express';

import { log, getENV, trace, traceId } from '@/configs';

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
	const errorId = traceId();

	log(`http-error-${errorId}`).error(JSON.stringify({
		headers: req.headers,
		body: req.body || {},
		query: req.query || {},
		params: req.params || {}
	}, null, '   '));
	log(`http-error-${errorId}`).error(err);
	trace('http-error').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(result, null, '   ')}`);

	res.status(status || 500).send(result);
};
