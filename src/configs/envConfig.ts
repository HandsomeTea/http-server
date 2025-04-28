interface EnvConfigType {
	NODE_ENV: 'development' | 'production' | 'test'
	SERVER_NAME: string
	ROOT_URL: string
	PORT: string
	LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
	TRACE_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
	DEV_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
	AUDIT_LOG_LEVEL?: 'all' | 'mark' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'
	ENABLE_OTEL_LOGS?: 'yes' | 'no'
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
	MINIO_URL: string
	MINIO_ACCESS_KEY: string
	MINIO_SECRET_KEY: string
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
	ENABLE_OTEL_LOGS: 'no',
	JWT_SECRET: 'jwtSecret',
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	DB_TYPE: 'mongodb',
	// 'mysql://root:root@localhost:3306/test'
	// 'dm://SYSDBA:SYSDBA@localhost:5236?autoCommit=false'
	// 'mongodb://127.0.0.1:27017/test'
	// 'postgres://surpass:Bizconf_surpass@ops-dev.bizconf.cn/surpass'
	DB_URL: 'mongodb://admin:admin@localhost:27017/test?authSource=admin',
	MQ_URL: '',
	// redis://localhost:6379
	REDIS_URL: '',
	// 'http://0.0.0.0:9200'
	ES_URL: '',
	TENCENT_SMS_SECRET_ID: '',
	TENCENT_SMS_SECRET_KEY: '',
	TENCENT_SMS_APP_ID: '',
	TENCENT_SMS_SIGN_ID: '',
	TENCENT_OSS_SECRET_ID: '',
	TENCENT_OSS_SECRET_KEY: '',
	// http://localhost:9000
	MINIO_URL: '',
	MINIO_ACCESS_KEY: 'ySl5zgkKATzuv1o8jmOs',
	MINIO_SECRET_KEY: 'NLLvSrMVSJ4oatVSOPhafb8Hzsn5tWqHXJGwAS1b'
};

export default <K extends keyof EnvConfigType>(env: K): EnvConfigType[K] => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return process.env[env] || developConfig[env];
};
