const { response } = require('../utils');

/**
 * 返回类型封装:[success，failure，notFound，serverError，noPermission，tooManyRequests]
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (req, res, next) => {
    const _status = response(res, req);

    res.success = (_data, _type = undefined) => _status.success(_data, _type);
    res.failure = (_data, _type = undefined) => _status.failure(_data, _type);
    res.notFound = (_data, _type = undefined) => _status.notFound(_data, _type);
    res.serverError = (_data, _type = undefined) => _status.internalError(_data, _type);
    res.noPermission = (_data, _type = undefined) => _status.unauthorized(_data, _type);
    res.tooManyRequests = (_data, _type = undefined) => _status.tooManyRequests(_data, _type);

    next();
};
