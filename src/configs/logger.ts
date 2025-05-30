import log4js from 'log4js';
import { trace as OtelTrace, SpanStatusCode } from '@opentelemetry/api';
import httpContext from 'express-http-context';
import getENV from './envConfig';

// 将日志作为span事件属性发送给OpenTelemetry
const logToOpenTelemetrySpan = async (attributes: Record<string, string> & { message: string }, startTime: Date, isErrorLevel: boolean, callStack?: string) => {
    const activeSpan = OtelTrace.getActiveSpan();

    if (!activeSpan) {
        return;
    }
    activeSpan.updateName(getENV('SERVER_NAME'))
    try {
        // 如果是错误级别，标记 span 为错误
        if (isErrorLevel) {
            activeSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: attributes.message
            });
            activeSpan.addEvent('error-stack', { stack: callStack }, startTime);
        } else {
            activeSpan.addEvent('log', attributes, startTime);
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
            ...getENV('ENABLE_OTEL') === 'yes' ? {
                _custom: {
                    type: {
                        configure: (/*config: unknown, layout: log4js.LayoutsParam*/) => {
                            // config 即_custom对象的值

                            return (loggingEvent: log4js.LoggingEvent): void => {
                                // 解析需要的数据
                                const attributes = {
                                    level: loggingEvent.level.levelStr,
                                    message: loggingEvent.data.join(''),
                                };

                                // 将数据它用，比如存储起来，或者交给第三方工具记录(如日志全链路追踪收集系统)
                                logToOpenTelemetrySpan(attributes, loggingEvent.startTime, loggingEvent.level.level >= log4js.levels.ERROR.level, loggingEvent.callStack)
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
                // 在日志中加入新的日志处理handle，用于将日志数据发送到OpenTelemetry(暂时取消，改为直接在中间件中处理)
                // appenders: getENV('ENABLE_OTEL') === 'yes' ? ['_trace', '_custom'] : ['_trace'],
                appenders: ['_trace'],
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
export const trace = (module?: string): log4js.Logger => {
    const _traceLogger = log4js.getLogger('traceLog');
    let traceId = '', spanId = '', parentSpanId = '';

    // if (getENV('ENABLE_OTEL') === 'yes') {
    //     const span = OtelTrace.getActiveSpan();

    //     if (span) {
    //         const context = span.spanContext();
    //         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //         // @ts-ignore
    //         const parentContext: SpanContext | undefined = span.parentSpanContext;

    //         traceId = context.traceId;
    //         spanId = context.spanId;
    //         parentSpanId = parentContext?.spanId || '';
    //     }
    // } else {
    traceId = httpContext.get('traceId');
    spanId = httpContext.get('spanId');
    parentSpanId = httpContext.get('parentSpanId');
    // }

    _traceLogger.addContext('Module', (module || getENV('SERVER_NAME') || 'default-module').toUpperCase());
    _traceLogger.addContext('TraceId', traceId);
    _traceLogger.addContext('SpanId', spanId);
    _traceLogger.addContext('ParentSpanId', parentSpanId || '');

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
