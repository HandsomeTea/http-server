module.exports = socket => {
    socket.lastPing = +new Date();
    socket.on('message', params => {
        const data = JSON.parse(params);

        if (data.msg === 'pong') {
            socket.lastPing = +new Date();
        }
    });

    socket.pingInterval = setInterval(() => {
        socket.send(JSON.stringify({ msg: 'ping' }));
    }, parseInt(IntervalPing) * 1000);
    socket.pingCheckInterval = setInterval(() => {
        if (+new Date() - socket.lastPing > 3 * parseInt(IntervalPing) * 1000 + 2) {
            socket.close();
            return;
        }
    }, parseInt(IntervalPing) * 1000 / 2);

    socket.on('close', () => {
        global.socketConnectionNum--;
        if (socket.attempt.userId) {
            global.socketOnlineNum--;
        }
        clearInterval(socket.pingInterval);
        clearInterval(socket.pingCheckInterval);
        socket.pingInterval = null;
        socket.pingCheckInterval = null;
    });
};
