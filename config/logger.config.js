const log4js = require('log4js');

/**
 * 定义日志配置
 *
 * @returns
 */
exports.updateOrCreateLogInstance = () => {
    log4js.configure({
        disableClustering: true, //支持nodejs集群启动模式
        appenders: {
            _trace: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '%[[%d{ISO8601_WITH_TZ_OFFSET}] [%p] [%h] [%X{Module}] [%X{TraceId}|%X{SpanId}|%X{ParentSpanId}]%] %m'
                }
            },
            _audit: {
                type: 'dateFile',
                filename: 'logs/audit', //您要写入日志文件的路径
                alwaysIncludePattern: true, //（默认为false） - 将模式包含在当前日志文件的名称以及备份中
                pattern: 'yyyy-MM-dd.log', //（可选，默认为.yyyy-MM-dd） - 用于确定何时滚动日志的模式。格式:.yyyy-MM-dd-hh:mm:ss.log
                encoding: 'utf-8',
                layout: {
                    type: 'pattern',
                    pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%X{Module}] %m'
                }
            },
            _develop: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '%[[%d] [%p] [%X{Module} %f:%l:%o]%] %m'
                }
            },
            _system: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS} SYSTEM:%X{Module}]%] %m'
                }
            }
        },
        categories: {
            default: {
                appenders: ['_develop', '_trace', '_audit', '_system'],
                level: 'OFF',
                enableCallStack: true
            },
            developLog: {
                appenders: ['_develop'],
                level: process.env.NODE_ENV === 'development' ? process.env.DEV_LOG_LEVEL || 'ALL' : 'OFF',
                enableCallStack: true
            },
            traceLog: {
                appenders: ['_trace'],
                level: process.env.NODE_ENV === 'development' ? process.env.TRACE_LOG_LEVEL || 'ALL' : 'OFF',
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
 * @param {string} _module
 */
exports.log = _module => {
    const _devLogger = log4js.getLogger('developLog');

    _devLogger.addContext('Module', _module || 'default-module');

    return _devLogger;
};

/**
 * 追踪日志使用
 * @param {string} _module
 */
exports.trace = (_module, _data) => {
    const _traceLogger = log4js.getLogger('traceLog');

    _traceLogger.addContext('Module', _module || 'default-module');
    _traceLogger.addContext('TraceId', _data.traceId || '');
    _traceLogger.addContext('SpanId', _data.spanId || '');
    _traceLogger.addContext('ParentSpanId', _data.parentSpanId || '');

    return _traceLogger;
};

/**
 * 操作日志使用
 * @param {string} _module
 */
exports.audit = _module => {
    const _auditLogger = log4js.getLogger('auditLog');

    _auditLogger.addContext('Module', _module || 'default-module');

    return _auditLogger;
};

/**
 * 系统日志使用
 * @param {string} _module
 */
exports.system = _module => {
    const _systemLogger = log4js.getLogger('systemLog');

    _systemLogger.addContext('Module', _module.toUpperCase());

    return _systemLogger;
};

/**
 * 生成跟踪日志的traceID
 * @returns {string}
 */
exports.traceId = () => {
    const digits = '0123456789abcdef';

    let _trace = '';

    for (let i = 0; i < 16; i += 1) {
        const rand = Math.floor(Math.random() * 16);

        _trace += digits[rand];
    }
    return _trace;
};

/**开发日志的日志模块定义 */
exports.logModule = {
    api: 'HTTP_REQUEST',
    startup: 'SYSREM_STARTUP',
    stop: 'SYSREM_STOP_CLEAN',
    db: 'DATABASE',
    system: 'SYSTEM'
};

/**audit日志的日志模块定义 */
exports.auditModule = {
    startup: 'SYSTEM_STARTUP',
    add: 'ADD',
    del: 'DELETE',
    update: 'UPDATE',
    search: 'SEARCH',
    system: 'SYSTEM',
    request: 'REST_API',
    error: 'SYSTEM_ERROR'
};

/**追踪类日志的日志模块定义 */
exports.traceModule = {
    default: process.env.SERVER_NAME || 'common-server'
};
