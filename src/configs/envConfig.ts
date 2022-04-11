// import yaml from 'js-yaml';
// import fs from 'fs';
// import { system, updateOrCreateLogInstance } from './logger';

// /**
//  * 检查环境变量设置的值
//  * @param {string} _key
//  * @param {*} _value
//  */
// const envValidate = (_key: progressConfigParams, _value: string) => {
//     if (_key.includes('LOG_LEVEL')) {
//         if (['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK', 'OFF'].includes(_value.toUpperCase())) {
//             return _value;
//         } else {
//             system('check-env-value').error(`refused !!!. LOG_LEVEL want to change from ${JSON.stringify(process.env[_key])} to ${JSON.stringify(_value)}, level ${JSON.stringify(_value)} not recognised : valid levels are ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, MARK, OFF. `);
//             return process.env[_key];
//         }
//     }
//     return _value;
// };

// /**
//  * 将配置文件设置的环境变量更新到程序中
//  */
// export const setENV = (filePath: string): void => {
//     let config: Record<progressConfigParams, string> | null = null;

//     try {
//         config = yaml.load(fs.readFileSync(filePath, 'utf8')) as Record<progressConfigParams, string>;
//     } catch (err) {
//         system('set-env').error(`change env config failed : ${JSON.stringify(err)}`);
//     }

//     let _arr = 0;

//     for (const _key in config) {
//         const _config = envValidate(_key as progressConfigParams, config[_key]);

//         if (process.env[_key] !== _config) {
//             _arr++;
//             system('set-env').warn(`process.env.${_key} from ${JSON.stringify(process.env[_key])} to ${JSON.stringify(_config)}`);
//             process.env[_key] = _config;
//             if (['TRACE_LOG_LEVEL', 'AUDIT_LOG_LEVEL', 'DEV_LOG_LEVEL', 'NODE_ENV'].includes(_key)) {
//                 updateOrCreateLogInstance();
//             }
//         }
//     }
//     system('set-env').warn(_arr > 0 ? `change env configuration from ${filePath} success.` : 'the configuration of peocess.env no changed.');
// };

interface EnvConfigType {
    NODE_ENV: 'development' | 'production' | 'test'
    SERVER_NAME: string
    ROOT_URL: string
    PORT: string
    LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    TRACE_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    DEV_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    AUDIT_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    JWT_APP_NAME: string
    JWT_APP_ID: string
    JWT_APP_SECERT: string
    REDIS_URL: string
    DB_TYPE: DBServerType
    MONGO_URL: string
    MYSQL_URL: string
    DM_URL: string
    MQ_URL: string
}
const developConfig: EnvConfigType = {
    NODE_ENV: 'development',
    SERVER_NAME: 'personal server',
    ROOT_URL: 'http://localhost:3000',
    PORT: '3000',
    LOG_LEVEL: 'all',
    TRACE_LOG_LEVEL: 'all',
    DEV_LOG_LEVEL: 'all',
    AUDIT_LOG_LEVEL: 'all',
    JWT_APP_NAME: 'my project',
    JWT_APP_ID: 'jwtAppId',
    JWT_APP_SECERT: 'jwtSecret',
    REDIS_URL: 'redis://127.0.0.1:6379',
    DB_TYPE: 'mongodb',
    MONGO_URL: 'mongodb://localhost:27017/test',
    MYSQL_URL: 'mysql://root:root@localhost:3306/test',
    DM_URL: 'dm://SYSDBA:SYSDBA@localhost:5236?autoCommit=false',
    MQ_URL: ''
};

export default <K extends keyof EnvConfigType>(env: K): EnvConfigType[K] => {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        return developConfig[env];
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return process.env[env];
};
