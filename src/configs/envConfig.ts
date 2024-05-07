interface EnvConfigType {
    NODE_ENV: 'development' | 'production' | 'test'
    SERVER_NAME: string
    ROOT_URL: string
    PORT: string
    LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    TRACE_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    DEV_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    AUDIT_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
    JWT_ISSURE: string
    JWT_SUBJECT: string
    JWT_SECRET: string
    REDIS_URL: string
    DB_TYPE: DBServerType
    DB_URL: string
    MQ_URL: string
    ES_URL: string
    TENCENT_SMS_SECRET_KEY: string
    TENCENT_SMS_SECRET_ID: string
    TENCENT_SMS_APP_ID: string
    TENCENT_SMS_SIGN_ID: string
    TENCENT_OSS_SECRET_ID: string
    TENCENT_OSS_SECRET_KEY: string
}
const developConfig: EnvConfigType = {
    NODE_ENV: 'development',
    SERVER_NAME: 'personal server',
    ROOT_URL: 'http://localhost:3000',
    PORT: '3004',
    LOG_LEVEL: 'all',
    TRACE_LOG_LEVEL: 'all',
    DEV_LOG_LEVEL: 'all',
    AUDIT_LOG_LEVEL: 'all',
    JWT_ISSURE: 'my project',
    JWT_SUBJECT: 'jwtAppId',
    JWT_SECRET: 'jwtSecret',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    DB_TYPE: 'mongodb',
    // 'mysql://root:root@localhost:3306/test'
    // 'dm://SYSDBA:SYSDBA@localhost:5236?autoCommit=false'
    // 'mongodb://127.0.0.1:27017/test'
    // 'postgres://surpass:Bizconf_surpass@ops-dev.bizconf.cn/surpass'
    DB_URL: 'mongodb://admin:admin@10.4.48.13:27017/test?authSource=admin',
    MQ_URL: '',
    // redis://127.0.0.1:6379
    REDIS_URL: 'redis://10.4.48.13:6379',
    // 'http://0.0.0.0:9200'
    ES_URL: '',
    TENCENT_SMS_SECRET_ID: '',
    TENCENT_SMS_SECRET_KEY: '',
    TENCENT_SMS_APP_ID: '',
    TENCENT_SMS_SIGN_ID: '',
    TENCENT_OSS_SECRET_ID: '',
    TENCENT_OSS_SECRET_KEY: ''
};

export default <K extends keyof EnvConfigType>(env: K): EnvConfigType[K] => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return process.env[env] || developConfig[env];
};
