const { traceModule } = require('../../config/log.type');
const HttpError = require('../../config/http.error.type');
const { trace } = require('../../config/logger.config');

/**
 * 服务器收到的请求达到上限的处理
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.tooMany = (info = {}, type) => {
        const result = { result: false, type: type || HttpError.tooMany, info };

        trace(traceModule.default, { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).warn(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(429).send(result);
    };

    next();
};
