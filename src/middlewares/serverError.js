const { traceModule } = require('../../config/log.type');
const HttpError = require('../../config/http.error.type');

/**
 * 服务器处理请求出错
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.serverError = (info = {}, type) => {
        const result = { result: false, type: type || HttpError.innerError, info };

        trace(traceModule.default, { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).warn(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(500).send(result);
    };

    next();
};