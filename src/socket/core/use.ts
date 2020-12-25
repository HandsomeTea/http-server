import { MyWebSocket } from '../../../websocket';

export default (socket: MyWebSocket): void => {
    // eslint-disable-next-line no-unused-vars
    socket.use = (fn: (_methodName: SocketMethod, _methodParams: Array<unknown>, _socket: MyWebSocket) => Promise<Record<string, unknown> | undefined>): MyWebSocket => {
        socket.middlewareMap.add(fn);
        return socket;
    };
};
