module.exports = socket => {
    socket.lastPing = +new Date();

    socket.pingInterval = setInterval(() => {
        socket.send(JSON.stringify({ msg: 'ping' }));
    }, parseInt(IntervalPing) * 1000);

    socket.pingCheckInterval = setInterval(() => {
        if (+new Date() - socket.lastPing > 3 * parseInt(IntervalPing) * 1000 + 2) {
            socket.close();
            return;
        }
    }, parseInt(IntervalPing) * 1000 / 2);
};
