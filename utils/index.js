const { createOrUpdateLogInstance, log, trace, audit, system, traceId } = require('./log');
const { response, httpStatus } = require('./http-result');
const { UTCTime } = require('./tools');

module.exports = {
    log,
    trace,
    audit,
    system,
    traceId,
    response,
    httpStatus,
    UTCTime,
    createOrUpdateLogInstance
};
