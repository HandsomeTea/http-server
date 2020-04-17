module.exports = socket => {
    socket.on('close', () => {
        global.socketConnectionNum--;
        if (socket.attempt.userId) {
            global.socketOnlineNum--;
            global.WebsocketServerMap[socket.attempt.userId].delete(socket);
        }
        clearInterval(socket.pingInterval);
        clearInterval(socket.pingCheckInterval);
        socket.pingInterval = null;
        socket.pingCheckInterval = null;
    });
};
