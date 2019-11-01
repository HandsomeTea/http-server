import log4js from 'log4js';

/**
 * 定义日志配置
 *
 * @param {string} [_module='default-module']
 * @returns
 */
const _log = (_module = 'default-module', _data = {}) => {
    log4js.configure({
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
                filename: 'audit', //您要写入日志文件的路径
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
                    pattern: '%[[%d{yyyy-MM-dd hh:mm:ss} SYSTEM:%X{Module}]%] %m'
                }
            }
        },
        categories: {
            default: {
                appenders: ['_develop', '_trace', '_audit', '_system'],
                level: 'ALL',
                enableCallStack: true
            },
            developLog: {
                appenders: ['_develop'],
                level: process.env.DEV_LOG_LEVEL || 'ALL',
                enableCallStack: true
            },
            traceLog: {
                appenders: ['_trace'],
                level: process.env.TRACE_LOG_LEVEL || 'ALL',
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

    const [devLogger, traceLogger, auditLogger, systemLogger] = [log4js.getLogger('developLog'), log4js.getLogger('traceLog'), log4js.getLogger('auditLog'), log4js.getLogger('systemLog')];

    devLogger.addContext('Module', _module);
    traceLogger.addContext('Module', _module);
    auditLogger.addContext('Module', _module);
    systemLogger.addContext('Module', _module.toUpperCase());

    traceLogger.addContext('TraceId', _data.traceId || '');
    traceLogger.addContext('SpanId', _data.spanId || '');
    traceLogger.addContext('ParentSpanId', _data.parentSpanId || '');

    return { devLogger, traceLogger, auditLogger, systemLogger };
};

/**
 * 开发时打印日志使用
 * @param {string} _module
 */
export const log = _module => {
    return _log(_module).devLogger;
};

/**
 * 追踪日志使用
 * @param {string} _module
 */
export const trace = (_module, _data) => {
    return _log(_module, _data).traceLogger;
};

/**
 * 操作日志使用
 * @param {string} _module
 */
export const audit = _module => {
    return _log(_module).auditLogger;
};

/**
 * 系统日志使用
 * @param {string} _module
 */
export const system = _module => {
    return _log(_module).systemLogger;
};


/**
 * 生成跟踪日志的traceID
 * @returns
 */
export const traceId = () => {
    const digits = '0123456789abcdef';

    let _trace = '';

    for (let i = 0; i < 16; i += 1) {
        const rand = Math.floor(Math.random() * 16);

        _trace += digits[rand];
    }
    return _trace;
};
