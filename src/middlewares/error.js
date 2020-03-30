const { auditModule, traceModule } = require('../../config/log.type');
const HttpError = require('../../config/http.error.type');
const { audit, trace } = require('../../config/logger.config');

/**
 * 捕捉路由中未处理的错误，即直接throw new Error的情况
 * @param {*} err
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (err, req, res, next) => { /* eslint-disable-line*/
    const result = { result: false, type: HttpError.innerError, info: 'Something broke! please try again.' };

    audit(auditModule.error).fatal(`${err.stack}`);
    trace(traceModule.default, { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] }).warn(`[${req.ip}(${req.method}): ${req.protocol}://${req.get('host')}${req.originalUrl}] response error with : Error[${err.type}: ${err.message}] . result : ${JSON.stringify(result)} .`);
    res.status(500).send(result);
};
