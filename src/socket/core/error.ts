import { log } from '@/configs';
import { MyWebSocket } from '../../../websocket';

export default (socket: MyWebSocket): void => {
    socket.on('error', err => {
        log('socket-error').error(err);
    });
};
