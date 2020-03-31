const { errorType, trace } = require('../../src/configs');

/**
 * 服务器处理失败
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.failure = (info = {}, type) => {
        const result = { result: false, type: type || errorType.BAD_REQUEST, info };

        trace('http-failed', { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).warn(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(400).send(result);
    };

    next();
};
