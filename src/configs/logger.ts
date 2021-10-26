import log4js from 'log4js';

/**
 * 定义日志配置
 */
export const updateOrCreateLogInstance = (): void => {
    log4js.configure({
        disableClustering: true, //支持nodejs集群启动模式
        appenders: {
            _trace: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '%[[%d{ISO8601_WITH_TZ_OFFSET}] [%p] [%h] [%X{Module}] [%X{TraceId}|%X{SpanId}|%X{ParentSpanId}]%] %m%n'
                }
            },
            _audit: {
                type: 'dateFile',
                filename: 'public/logs/audit', //您要写入日志文件的路径
                alwaysIncludePattern: true, //（默认为false） - 将模式包含在当前日志文件的名称以及备份中
                pattern: 'yyyy-MM-dd.log', //（可选，默认为.yyyy-MM-dd） - 用于确定何时滚动日志的模式。格式:.yyyy-MM-dd-hh:mm:ss.log
                encoding: 'utf-8',
                layout: {
                    type: 'pattern',
                    pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%X{Module}] %m%n'
                }
            },
            _develop: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '%[[%d{ISO8601_WITH_TZ_OFFSET}] [%p] [%X{Module} %f:%l:%o]%] %m%n'
                }
            },
            _system: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '%[[%d{ISO8601_WITH_TZ_OFFSET} SYSTEM:%X{Module}]%] %m'
                }
            }
            // [2021-09-23 16:59:33.762] %d{yyyy-MM-dd hh:mm:ss.SSS}
            // [2021-08-05T18:17:00.549] %d
            // [2021-08-05T18:17:39.235+0800] %d{ISO8601_WITH_TZ_OFFSET}
            // [18:18:21.475] %d{ABSOLUTE}
            // [05 08 2021 18:19:20.196] %d{DATE}
            // [2021-08-05T18:19:44.804] %d{ISO8601}
        },
        categories: {
            default: {
                appenders: ['_develop', '_trace', '_audit', '_system'],
                level: 'OFF',
                enableCallStack: true
            },
            developLog: {
                appenders: ['_develop'],
                level: process.env.NODE_ENV === 'production' ? 'OFF' : process.env.DEV_LOG_LEVEL || 'ALL',
                enableCallStack: true
            },
            traceLog: {
                appenders: ['_trace'],
                level: process.env.NODE_ENV === 'production' ? 'OFF' : process.env.TRACE_LOG_LEVEL || 'ALL',
                enableCallStack: true
            },
            auditLog: {
                appenders: ['_audit'],
                level: process.env.AUDIT_LOG_LEVEL || 'ALL',
                enableCallStack: true
            },
            systemLog: {
                appenders: ['_system'],
                level: 'ALL'
            }
        }
    });
};

/**
 * 开发时打印日志使用
 */
export const log = (module?: string): log4js.Logger => {
    const _devLogger = log4js.getLogger('developLog');

    _devLogger.addContext('Module', module || 'HTTP_REQUEST');

    return _devLogger;
};

/**
 * 追踪日志使用
 */
export const trace = (data: { traceId: string, spanId: string, parentSpanId?: string }, module?: string): log4js.Logger => {
    const _traceLogger = log4js.getLogger('traceLog');

    _traceLogger.addContext('Module', (module || process.env.SERVER_NAME || 'default-module').toUpperCase());
    _traceLogger.addContext('TraceId', data.traceId);
    _traceLogger.addContext('SpanId', data.spanId);
    _traceLogger.addContext('ParentSpanId', data.parentSpanId || '');

    return _traceLogger;
};

/**
 * 操作日志使用
 */
export const audit = (module?: string): log4js.Logger => {
    const _auditLogger = log4js.getLogger('auditLog');

    _auditLogger.addContext('Module', (module || 'default-module').toUpperCase());

    return _auditLogger;
};

/**
 * 系统日志使用
 * @param {string} module
 */
export const system = (module: string): log4js.Logger => {
    const _systemLogger = log4js.getLogger('systemLog');

    _systemLogger.addContext('Module', module.toUpperCase());

    return _systemLogger;
};

/**
 * 生成跟踪日志的traceID
 * @returns {string}
 */
export const traceId = (): string => {
    const digits = '0123456789abcdef';

    let _trace = '';

    for (let i = 0; i < 16; i += 1) {
        const rand = Math.floor(Math.random() * digits.length);

        _trace += digits[rand];
    }
    return _trace;
};
