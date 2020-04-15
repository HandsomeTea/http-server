module.exports = socket => {

    /**
     *
     *
     * @param {string} [fn=(methodName = '', methodParams = [], socket) => { }]
     * @returns
     */
    socket.use = (fn = (/*methodName = '', methodParams = [], socket*/) => { }) => {
        socket.middlewareMap.add(fn);
        return socket;
    };
};
