import log4js from 'log4js';
import { trace as OtelTrace, SpanStatusCode } from '@opentelemetry/api';
import getENV from './envConfig';

// 将日志作为span事件属性发送给OpenTelemetry
const logToOpenTelemetrySpan = async (attributes: Record<string, string> & { message: string }, startTime: Date, isErrorLevel: boolean) => {
    const activeSpan = OtelTrace.getActiveSpan();

    if (!activeSpan) {
        return;
    }

    try {
        activeSpan.addEvent('log', attributes, startTime);

        // 如果是错误级别，标记 span 为错误
        if (isErrorLevel) {
            activeSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: attributes.message
            });
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
    }
}

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
                    pattern: '[%d{ISO8601_WITH_TZ_OFFSET}] [%p] [%X{Module}] [%X{TraceId}|%X{SpanId}|%X{ParentSpanId}] %[ %m%n %]'
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
                    pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%X{Module}]  %m%n '
                }
            },
            _develop: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: '[%d{ISO8601_WITH_TZ_OFFSET}] [%p] [%X{Module}] [%f:%l:%o] %[ %m%n %]'
                }
            },
            _system: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    // [2021-09-23 16:59:33.762] %d{yyyy-MM-dd hh:mm:ss.SSS}
                    // [2021-08-05T18:17:00.549] %d
                    // [2021-08-05T18:17:39.235+0800] %d{ISO8601_WITH_TZ_OFFSET}
                    // [18:18:21.475] %d{ABSOLUTE}
                    // [05 08 2021 18:19:20.196] %d{DATE}
                    // [2021-08-05T18:19:44.804] %d{ISO8601}
                    pattern: '[%d{ISO8601_WITH_TZ_OFFSET}] [%p] [SYSTEM:%X{Module}] %[ %m%n %]'
                }
            },
            ...getENV('ENABLE_OTEL_LOGS') === 'yes' ? {
                _custom: {
                    type: {
                        configure: (/*config: unknown, layout: log4js.LayoutsParam*/) => {
                            // config 即_custom对象的值

                            return (loggingEvent: log4js.LoggingEvent): void => {
                                // 解析需要的数据
                                const attributes = {
                                    application: getENV('SERVER_NAME'),
                                    level: loggingEvent.level.levelStr,
                                    module: loggingEvent.context['Module'],
                                    traceId: loggingEvent.context['TraceId'],
                                    spanId: loggingEvent.context['SpanId'],
                                    parentSpanId: loggingEvent.context['ParentSpanId'],
                                    message: loggingEvent.data.join(''),
                                };

                                // 将数据它用，必须存储起来，或者交给第三方工具记录(如日志全链路追踪收集系统)
                                logToOpenTelemetrySpan(attributes, loggingEvent.startTime, loggingEvent.level.level >= log4js.levels.ERROR.level)
                            };
                        }
                    }
                }
            } : {}
        },
        categories: {
            default: {
                appenders: ['_develop', '_trace', '_audit', '_system'],
                level: 'OFF',
                enableCallStack: true
            },
            developLog: {
                appenders: ['_develop'],
                level: getENV('DEV_LOG_LEVEL') || getENV('LOG_LEVEL') || 'OFF',
                enableCallStack: true
            },
            traceLog: {
                appenders: getENV('ENABLE_OTEL_LOGS') === 'yes' ? ['_trace', '_custom'] : ['_trace'],
                level: getENV('TRACE_LOG_LEVEL') || getENV('LOG_LEVEL') || 'ALL',
                enableCallStack: true
            },
            auditLog: {
                appenders: ['_audit'],
                level: getENV('AUDIT_LOG_LEVEL') || getENV('LOG_LEVEL') || 'ALL',
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

    _traceLogger.addContext('Module', (module || getENV('SERVER_NAME') || 'default-module').toUpperCase());
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
