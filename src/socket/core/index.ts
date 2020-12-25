import onping from './onping';
import err from './error';
import use from './use';
import close from './close';
import { MyWebSocket } from '../../../websocket';

export default (socket: MyWebSocket): void => {
    err(socket);
    onping(socket);
    use(socket);
    close(socket);
};
