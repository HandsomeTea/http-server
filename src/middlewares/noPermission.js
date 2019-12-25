const { traceModule } = require('../../config/log.type');
const HttpError = require('../../config/http.error.type');

/**
 * 服务器处理没有权限的访问
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.noPermission = (info = {}, type) => {
        const result = { result: false, type: type || HttpError.noPermission, info };

        trace(traceModule.default, { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).error(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(403).send(result);
    };

    next();
};
