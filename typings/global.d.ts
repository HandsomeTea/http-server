import { MyWebSocket, WebSocketServer } from '../websocket';

/**global变量 */
declare global {
    namespace NodeJS {
        interface Global {
            WebsocketUserIdMap: Record<string, Set<MyWebSocket>>;
            WebsocketServer: WebSocketServer;
            isServerRunning: boolean;
            IntervalUpdateInstance: number;
            IntervalCheckEmptySession: number;
            IntervalCleanSessionOfInstance: number;
            Exception: ExceptionConstructor
        }
    }
}
