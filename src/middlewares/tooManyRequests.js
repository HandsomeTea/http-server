const { trace, errorType } = require('../../src/configs');
const { isType } = require('../utils');

/**
 * 服务器收到的请求达到上限的处理
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.tooMany = (error = {}, type) => {
        const result = {
            result: false,
            type: type || errorType.TOO_MANY_REQUESTS,
            error: {
                info: error && error.info || '',
                ...isType(error) === 'object' ? error : {}
            }
        };

        trace('http-too-many', { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).warn(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(429).send(result);
    };

    next();
};
