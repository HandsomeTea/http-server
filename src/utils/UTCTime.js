const _toFixed = require('./fixed_num_str');

/**
 * 生成 yyyy-MM-ddTHH:mm:ss.SSSXXX 格式的UTC时间
 *
 * @returns
 */
module.exports = () => {
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
