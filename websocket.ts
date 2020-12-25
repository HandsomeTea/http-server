import WebSocket from 'ws';
import http from 'http';

interface Middleware {
    // eslint-disable-next-line no-unused-vars
    (methodName: SocketMethod, methodParams: Array<unknown>, socket: MyWebSocket): Promise<Record<string, unknown> | undefined> // eslint-disable-line no-use-before-define
}

interface MyWebSocket extends WebSocket {
    attempt: SocketAttempt
    middlewareMap: Set<Middleware>
    use: (fn: Middleware) => MyWebSocket // eslint-disable-line no-unused-vars
}


class WebSocketServer extends WebSocket.Server {
    constructor(_options?: WebSocket.ServerOptions, _callback?: (() => void)) {
        super(_options, _callback);
    }

    connection(cb: (socket: MyWebSocket, request: http.IncomingMessage) => void): void {// eslint-disable-line no-unused-vars
        this.on('connection', cb);
    }

    get wsClients(): Set<MyWebSocket> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this.clients;
    }
}

export { WebSocketServer, MyWebSocket };
