const { trace, traceId, log, audit, system, updateOrCreateLogInstance } = require('./logger.config');
const { setENV } = require('./env.config');
const { errorType, errorCodeMap } = require('./http.error.type');


module.exports = {
    trace,
    traceId,
    log,
    audit,
    system,
    updateOrCreateLogInstance,
    setENV,
    errorType,
    errorCodeMap
};
