import { Request, Response, NextFunction } from 'express';
import httpContext from 'express-http-context';
import { trace as OtelTrace } from '@opentelemetry/api';

import { getENV, trace, traceId } from '@/configs';

const filteNotAllown = (str?: string): string | void => {
    if (str) {
        str = str.trim();
        if (str && str !== 'undefined' && str !== 'null') {
            return str;
        }
    }
};
const getRequestIp = (request: Request): string | undefined => {
    const ipStr = request.headers['x-forwarded-for'] ||
        request.ip ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress || '';

    let ip = '';

    if (typeof ipStr === 'string' && ipStr.split(',').length > 0) {
        ip = ipStr.split(',')[0];
    }

    return /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.exec(ip)?.toString();
};

/**
 * 服务器接收到请求的相关处理
 */
export default (req: Request, _res: Response, next: NextFunction): void => {

    let _datas = `\nheader: ${JSON.stringify(req.headers, null, '   ')}`;

    if (Object.getOwnPropertyNames(req.body).length > 0) {
        _datas += `\nbody: ${JSON.stringify(req.body, null, '   ')}`;
    }
    if (Object.getOwnPropertyNames(req.query).length > 0) {
        _datas += `\nquery: ${JSON.stringify(req.query, null, '   ')}`;
    }
    if (Object.getOwnPropertyNames(req.params).length > 0) {
        _datas += `\nparams: ${JSON.stringify(req.params, null, '   ')}`;
    }

    httpContext.set('ip', getRequestIp(req));

    if (getENV('ENABLE_OTEL') === 'yes') {
        const span = OtelTrace.getActiveSpan();

        if (span) {
            const context = span.spanContext();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const parentContext: SpanContext | undefined = span.parentSpanContext;

            httpContext.set('traceId', context.traceId);
            httpContext.set('spanId', context.spanId);
            httpContext.set('parentSpanId', parentContext?.spanId || '');
            span.addEvent('http-request-parameters', {
                headers: JSON.stringify(Object.keys(req.headers).filter((key) => key !== 'authorization').map(a => ({ [a]: req.headers[a] })).reduce((a, b) => ({ ...a, ...b }), {}), null, '   '),
                body: JSON.stringify(req.body, null, '   '),
                query: JSON.stringify(req.query, null, '   '),
                params: JSON.stringify(req.params, null, '   ')
            });
        }
    } else {
        httpContext.set('traceId', filteNotAllown(req.get('x-b3-traceid')) || traceId());
        httpContext.set('spanId', filteNotAllown(req.get('x-b3-spanid')) || traceId());
        httpContext.set('parentSpanId', filteNotAllown(req.get('x-b3-parentspanid')) || '');
    }

    trace('http-request').info(`${req.method}: ${req.originalUrl} ${_datas}`);

    next();
};
