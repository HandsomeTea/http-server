import yaml from 'js-yaml';
import fs from 'fs';
import { system, updateOrCreateLogInstance } from './logger.config';

/**
 * 检查环境变量设置的值
 * @param {string} _key
 * @param {*} _value
 */
const envValidate = (_key: progressConfigParams, _value: string) => {
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

/**
 * 将配置文件设置的环境变量更新到程序中
 */
export const setENV = (filePath: string): void => {
    let config: Record<progressConfigParams, string> | null = null;

    try {
        config = yaml.load(fs.readFileSync(filePath, 'utf8')) as Record<progressConfigParams, string>;
    } catch (err) {
        system('set-env').error(`change env config failed : ${JSON.stringify({ response: err.response, message: err.message })}`);
    }

    let _arr = 0;

    for (const _key in config) {
        const _config = envValidate(_key as progressConfigParams, config[_key]);

        if (process.env[_key] !== _config) {
            _arr++;
            system('set-env').warn(`process.env.${_key} from ${JSON.stringify(process.env[_key])} to ${JSON.stringify(_config)}`);
            process.env[_key] = _config;
            if (['TRACE_LOG_LEVEL', 'AUDIT_LOG_LEVEL', 'DEV_LOG_LEVEL', 'NODE_ENV'].includes(_key)) {
                updateOrCreateLogInstance();
            }
        }
    }
    system('set-env').warn(_arr > 0 ? `change env configuration from ${filePath} success.` : 'the configuration of peocess.env no changed.');
};
