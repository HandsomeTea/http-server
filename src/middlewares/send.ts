import { NextFunction, Request, Response } from 'express';
import { trace as OtelTrace } from '@opentelemetry/api';
import { getENV, trace } from '@/configs';

/**
 * 响应拦截器
 */
export default (req: Request, res: Response, next: NextFunction): void => {
    res.success = (data?: unknown) => {
        if (getENV('ENABLE_OTEL') === 'yes') {
            const span = OtelTrace.getActiveSpan();

            if (span) {
                span.addEvent('http-response-data', {
                    data: JSON.stringify(data, null, '   ')
                });
            }
        }
        trace('http-response').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(data, null, '   ')}`);

        res.status(200).send(data);
    };
    next();
};
