const { trace, errorType } = require('../../src/configs');

/**
 * 服务器成功处理完请求返回
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.success = (data = {}, type = '') => {
        const result = { result: true, type: type || errorType.SUCCESS, data };

        trace('return-response', { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).debug(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(200).send(result);
    };

    next();
};
