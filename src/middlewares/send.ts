import { Request, Response, NextFunction } from 'express';
import httpContext from 'express-http-context';
import { MyResponse } from '../../http';

import { trace, errorType } from '../../src/configs';

/**
 * 服务器成功处理完请求返回
 */
export default (req: Request, res: Response, next: NextFunction): void => {
    (res as MyResponse).success = async (data?: unknown) => { // eslint-disable-line no-extra-parens
        const result = { code: errorType.SUCCESS, data };

        trace({ traceId: httpContext.get('traceId'), spanId: httpContext.get('spanId'), parentSpanId: httpContext.get('parentSpanId') }, 'return-response').debug(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(200).send(result);
    };

    next();
};
