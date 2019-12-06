const { traceModule } = require('../../config/log.type');

/**
 * 服务器成功处理完请求返回
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.success = (data, type = '') => {
        trace(traceModule.default, { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).info(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(data)} .`);
        res.status(200).send({ result: true, type, data });
    };
    next();
};
