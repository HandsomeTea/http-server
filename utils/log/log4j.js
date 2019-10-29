import log4js from 'log4js';

/**
 * 定义日志配置
 *
 * @param {string} [_module='default-module']
 * @returns
 */
const _log = (_module = 'default-module') => {
    log4js.configure({
        appenders: {
            _trace: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '%[[%d{ISO8601_WITH_TZ_OFFSET}] [%p] [%h] [%X{Module} %f:%l:%o]%]%m%n'
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
                    pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%X{Module}] %m%n'
                }
            },
            _develop: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '%[[%d] [%p] [%X{Module} %f:%l]%] %m%n'
                }
            }
        },
        categories: {
            default: {
                appenders: ['_develop', '_trace', '_audit'],
                level: 'ALL',
                enableCallStack: true
            },
            developLog: {
                appenders: ['_develop'],
                level: process.env.LOG_LEVEL || 'ALL',
                enableCallStack: true
            },
            traceLog: {
                appenders: ['_trace'],
                level: process.env.LOG_LEVEL || 'ALL',
                enableCallStack: true
            },
            auditLog: {
                appenders: ['_audit'],
                level: process.env.LOG_LEVEL || 'ALL',
                enableCallStack: true
            }
        }
    });

    const [devLogger, traceLogger, auditLogger] = [log4js.getLogger('developLog'), log4js.getLogger('traceLog'), log4js.getLogger('auditLog')];

    devLogger.addContext('Module', _module);
    traceLogger.addContext('Module', _module);
    auditLogger.addContext('Module', _module);

    return { devLogger, traceLogger, auditLogger };
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
export const trace = _module => {
    return _log(_module).traceLogger;
};

/**
 * 操作日志使用
 * @param {string} _module
 */
export const audit = _module => {
    return _log(_module).auditLogger;
};
