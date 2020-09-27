module.exports = socket => {
    socket.on('close', () => {
        const { attempt: { userId/*, connection: { id }*/ }, pingInterval, pingCheckInterval } = socket;

        if (userId) {
            global.WebsocketServerMap[userId].delete(socket);
            if (global.WebsocketServerMap[userId].size === 0) {
                delete global.WebsocketServerMap[userId];
            }
        }
        if (pingInterval) {
            clearInterval(socket.pingInterval);
            socket.pingInterval = null;
        }

        if (pingCheckInterval) {
            clearInterval(socket.pingCheckInterval);
            socket.pingCheckInterval = null;
        }
    });
};
