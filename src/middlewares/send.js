const { traceModule } = require('../../config/log.type');
const HttpError = require('../../config/http.error.type');
const { trace } = require('../../config/logger.config');

/**
 * 服务器成功处理完请求返回
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.success = (data = {}, type = '') => {
        const result = { result: true, type: type || HttpError.success, data };

        trace(traceModule.default, { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).info(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(200).send(result);
    };

    next();
};
