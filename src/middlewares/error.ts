import { Request, Response, NextFunction } from 'express';
import httpContext from 'express-http-context';

import { audit, trace } from '../../src/configs';

/**
 * 捕捉路由中未处理的错误，即直接throw new Error的情况
 */
export default (err: InstanceException, req: Request, res: Response, _next: NextFunction) => { /* eslint-disable-line*/
    const { status, code, message, reason, source } = err;
    const result = {
        code: code || 'INTERNAL_SERVER_ERROR',
        error: {
            info: message,
            reason: reason,
            ...process.env.NODE_ENV === 'production' ? {} : { source: source && Array.isArray(source) && !source.includes(process.env.SERVER_NAME || '') ? source.concat(process.env.SERVER_NAME || '') : source }
        }
    };

    audit('SYSTEM_ERROR').fatal(err);
    trace({
        traceId: httpContext.get('traceId'),
        spanId: httpContext.get('spanId'),
        parentSpanId: httpContext.get('parentSpanId')
    }, 'http-error').warn(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response error with : Error[${err.code}: ${err.message}] . result : ${JSON.stringify(result)} .`);

    res.status(status || 500).send(result);
};
