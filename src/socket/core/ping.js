const { log } = require('../../configs');

module.exports = socket => {
    // socket.lastPing = +new Date();

    // socket.pingInterval = setInterval(() => {
    //     socket.send(JSON.stringify({ msg: 'ping' }));
    // }, parseInt(IntervalPing) * 1000);

    // socket.pingCheckInterval = setInterval(() => {
    //     if (+new Date() - socket.lastPing > 3 * parseInt(IntervalPing) * 1000 + 2) {
    //         socket.close();
    //         return;
    //     }
    // }, parseInt(IntervalPing) * 1000 / 2);

    socket.pingCheck = setInterval(() => {
        socket.ping('ping', true, error => {
            if (error) {
                log(`socket-ping[${socket.attempt.connection.id}]-check`).error(error);
                if (socket.readyState === 3) {
                    log('socket-ping-check').error(`client ${socket.attempt.connection.id} will be closed.`);
                    socket.close();
                    clearInterval(socket.pingCheck);
                }
            }
        });
    }, parseInt(IntervalPing) * 1000);
};
