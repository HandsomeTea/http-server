const { traceId, log, trace } = require('../../src/configs');

/**
 * 服务器接收到请求的相关处理
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {

    let _datas = '';

    if (Object.getOwnPropertyNames(req.body).length > 0) {
        _datas += ` body=>${JSON.stringify(req.body)}`;
    }
    if (Object.getOwnPropertyNames(req.query).length > 0) {
        _datas += ` query=>${JSON.stringify(req.query)}`;
    }
    if (Object.getOwnPropertyNames(req.params).length > 0) {
        _datas += ` params=>${JSON.stringify(req.params)}`;
    }

    let addressIpv4 = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    if (!addressIpv4) {
        addressIpv4 = '0.0.0.0';
        log('system-error').warn('The server does not specify a listening address, set default request address to 0.0.0.0 ');
    }
    req.ip = addressIpv4;

    if (!req.headers['x-b3-traceid']) {
        req.headers['x-b3-traceid'] = traceId();
        req.headers['x-b3-spanid'] = traceId();
    }

    trace('receive-request', { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).info(`[${addressIpv4}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] request parameter :${_datas || ' no parameter'} .`);

    next();
};
