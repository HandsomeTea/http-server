import { MyWebSocket } from '../../../websocket';
import { log } from '@/configs';
import { Sessions } from '@/models';

export default (socket: MyWebSocket): void => {
    socket.on('close', () => {
        const { attempt: { userId, connection: { id, device } }/*, pingInterval, pingCheckInterval*/ } = socket;

        if (userId) {
            if (global.WebsocketUserIdMap[userId]) {
                global.WebsocketUserIdMap[userId].delete(socket);
                if (global.WebsocketUserIdMap[userId].size === 0) {
                    delete global.WebsocketUserIdMap[userId];
                }
            }

            Sessions.deleteUserSession(userId, id);
        }

        if (device) {
            log('close-socket-connection').warn(`socket connection ${id} is closed at ${device.deviceType}(${device.model}) with user ${userId}.`);
        } else {
            log('close-socket-connection').warn(`socket connection ${id} is closed.`);
        }
    });
};
