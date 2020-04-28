module.exports = socket => {
    socket.on('close', () => {
        if (socket.attempt.userId) {
            global.WebsocketServerMap[socket.attempt.userId].delete(socket);
            if (global.WebsocketServerMap[socket.attempt.userId].size === 0) {
                delete global.WebsocketServerMap[socket.attempt.userId];
            }
        }
        clearInterval(socket.pingInterval);
        clearInterval(socket.pingCheckInterval);
        socket.pingInterval = null;
        socket.pingCheckInterval = null;
    });
};
