const { errorType, trace } = require('../../src/configs');
const { isType } = require('../utils');

/**
 * 服务器处理没有找到的资源
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    res.notFound = (error = {}, type) => {
        const result = {
            result: false,
            type: type || errorType.NOT_FOUND,
            error: {
                info: error && error.info || '',
                ...isType(error) === 'object' ? error : {}
            }
        };

        trace('http-not-found', { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).error(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response result : ${JSON.stringify(result)} .`);
        res.status(404).send(result);
    };

    next();
};
