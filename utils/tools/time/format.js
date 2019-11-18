const _ = require('underscore');


/**
 *
 * @param {[number,string]} _num
 * @param {number} _length
 */
const _toFixed = (_num, _length) => {
    if (!_.isNumber(parseInt(_num)) || !_.isNumber(parseInt(_length))) {
        console.error('_toFixed: parameter must be number or can be parseInt to number');
        return _num;
    }

    const _fixLen = (parseInt(_length) || 2) - (_num + '').trim().length;
    const _fixStr = _fixLen > 0 ? (0).toFixed(_fixLen - 1).replace('.', '') : '';

    return _fixStr + _num;
};

/**
 * 生成 yyyy-MM-ddTHH:mm:ss.SSSXXX 格式的UTC时间
 *
 * @returns
 */
const UTCTime = () => {
    const now = new Date();
    const { year, month, day, hour, minute, seconds, milliseconds } = {
        year: now.getUTCFullYear(),
        month: _toFixed(now.getUTCMonth() + 1),
        day: _toFixed(now.getUTCDate()),
        hour: _toFixed(now.getUTCHours()),
        minute: _toFixed(now.getUTCMinutes()),
        seconds: _toFixed(now.getUTCSeconds()),
        milliseconds: _toFixed(now.getUTCMilliseconds(), 3)
    };

    return `${year}-${month}-${day}T${hour}:${minute}:${seconds}.${milliseconds}Z`;
};

module.exports = {
    UTCTime
};
