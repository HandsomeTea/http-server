const { response, httpStatus } = require('./http_result');
const { UTCTime, traceId } = require('./tools');

module.exports = {
    traceId,
    response,
    httpStatus,
    UTCTime
};
