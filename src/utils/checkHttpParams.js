const { errorType } = require('../configs');
const { typeIs } = require('./type');

/**
 * 只用于检查http请求中参数的合法性
 *
 * @param {*} param
 * @param {*} type
 * @param {boolean} [allowedEmpty=true]
 * @param {*} [error=errorType.INVALID_ARGUMENTS]
 * @param {*} msg
 */
module.exports = (param, type, allowedEmpty = true, error = errorType.INVALID_ARGUMENTS, msg) => {

    if (param === undefined || param === null) {
        throw new Exception(msg || `Invalid arguments: ${param}`, error || errorType.INVALID_ARGUMENTS);
    }

    if (type === undefined || type === null) {
        throw new Exception(msg || `Invalid arguments: ${type}`, error || errorType.INVALID_ARGUMENTS);
    }

    if (param.constructor !== type) {
        throw new Exception(msg || `Invalid arguments: require ${typeIs(new type())}, but get ${typeIs(param)}`, error || errorType.INVALID_ARGUMENTS);
    }

    if (!allowedEmpty) {
        if (type === String && param.trim() === '') {
            throw new Exception(msg || 'Invalid arguments: not allowed empty string.', error || errorType.INVALID_ARGUMENTS);
        }

        if (type === Object && Object.keys(param).length === 0) {
            throw new Exception(msg || 'Invalid arguments: not allowed empty object.', error || errorType.INVALID_ARGUMENTS);
        }

        if (type === Array && param.length === 0) {
            throw new Exception(msg || 'Invalid arguments: not allowed empty array.', error || errorType.INVALID_ARGUMENTS);
        }
    }
};
