const { response, httpStatus } = require('./http_result');
const { UTCTime, traceId, delay } = require('./tools');

module.exports = {
    traceId,
    response,
    httpStatus,
    UTCTime,
    delay
};
