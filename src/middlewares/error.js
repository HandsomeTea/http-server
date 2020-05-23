const { audit, trace } = require('../../src/configs');

/**
 * 捕捉路由中未处理的错误，即直接throw new Error的情况
 * @param {*} err
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (err, req, res, next) => { /* eslint-disable-line*/
    const result = {
        result: false,
        type: err.type,
        error: {
            info: err.message
        }
    };

    audit('SYSTEM_ERROR').fatal(`${err.stack}`);
    trace('http-error', { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).warn(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response error with : Error[${err.type}: ${err.message}] . result : ${JSON.stringify(result)} .`);
    res.status(err.status).send(result);
};
