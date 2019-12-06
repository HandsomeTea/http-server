const _ = require('underscore');


/**
 * 将数字补全为多少位字符串
 * @param {[number,string]} _num
 * @param {number} _length
 */
module.exports = (_num, _length) => {
    if (!_.isNumber(parseInt(_num)) || !_.isNumber(parseInt(_length))) {
        console.error('fixed_num_str.js: parameter must be number or can be parseInt to number');/* eslint-disable-line no-console*/
        return _num;
    }

    const _fixLen = (parseInt(_length) < 2 ? 2 : parseInt(_length)) - (_num + '').trim().length;
    const _fixStr = _fixLen > 0 ? (0).toFixed(_fixLen - 1).replace('.', '') : '';

    return _fixStr + _num;
};
