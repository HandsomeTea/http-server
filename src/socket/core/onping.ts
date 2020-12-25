import { log } from '../../configs';
import { MyWebSocket } from '../../../websocket';

export default (socket: MyWebSocket): void => {
    socket.on('ping', ping => {
        log('ping-from-client').debug(`client ${socket.attempt.connection.id} ping message is : ${ping}`);
    });
};
