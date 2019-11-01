import { system } from '../../utils';

/**
 * 检查环境变量设置的值
 * @param {string} _key
 * @param {*} _value
 */
export const envValidate = (_key, _value) => {
    if (_key.includes('LOG_LEVEL')) {
        if (['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'].includes(_value.toUpperCase())) {
            return _value;
        } else {
            system('check-env-value').error(`refused !!!. LOG_LEVEL want to change from ${JSON.stringify(process.env[_key])} to ${JSON.stringify(_value)}, level ${JSON.stringify(_value)} not recognised : valid levels are ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, MARK, OFF. `);
            return process.env[_key];
        }
    }
    return _value;
};
