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
