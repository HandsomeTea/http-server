import { Request, Response, NextFunction } from 'express';
import { trace as OtelTrace } from '@opentelemetry/api';
import { getENV, log, trace } from '@/configs';

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

	if (getENV('ENABLE_OTEL') === 'yes') {
		const span = OtelTrace.getActiveSpan();

		if (span) {
			span.addEvent('http-response-error', {
				data: JSON.stringify(result, null, '   '),
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				error: err.stack
			});
		}
	}
	log('http-error').error(err);
	// trace('http-error').error(err);
	trace('http-response').error(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(result, null, '   ')}`);

	res.status(status || 500).send(result);
};
