const { log } = require('../../../config/logger.config');

module.exports = socket => {

    /**
     *
     *
     * @param {string} [fn=(methodName = '', methodParams = [], socket) => { }]
     * @param {*} fnId
     * @returns
     */
    socket.use = (fn = (/*methodName = '', methodParams = [], socket*/) => { }, fnId) => {
        if (!fnId) {
            log('add-socket-middleware').error('add socket middleware failed: no fnId');
            return;
        }

        if (!socket.middlewareMap[fnId]) {
            socket.middlewareMap[fnId] = fn;
        }
        return socket;
    };
};
