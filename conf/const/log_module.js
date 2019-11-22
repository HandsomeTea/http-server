module.exports = {
    logType: {
        api: 'HTTP_REQUEST',
        startup: 'SYSREM_STARTUP',
        stop: 'SYSREM_STOP_CLEAN',
        db: 'DATABASE',
        system: 'SYSTEM'
    },
    auditType: {
        startup: 'SYSTEM_STARTUP',
        add: 'ADD',
        del: 'DELETE',
        update: 'UPDATE',
        search: 'SEARCH',
        system: 'SYSTEM',
        request: 'REST_API',
        error: 'SYSTEM_ERROR'
    },
    traceType: {
        default: process.env.SERVER_NAME || 'common-server'
    }
};
