import { MyWebSocket } from '../../../websocket';
import check from './check';

export default (server: MyWebSocket): void => {
    server.use(check);
};
