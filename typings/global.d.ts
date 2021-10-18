import { MyWebSocket, WebSocketServer } from '../websocket';

/**global变量 */
declare global {
    namespace NodeJS {
        interface Global {
            WebsocketUserIdMap: Record<string, Set<MyWebSocket>>;
            WebsocketServer?: WebSocketServer;
            isServerRunning: boolean;
            /** instance保活间隔,单位为秒 */
            IntervalUpdateInstance: number;
            /** 清空无效的instance间隔,单位为秒 */
            IntervalCleanUnusedInstance: number;
            /** 清空空的session记录间隔,单位为秒 */
            IntervalCleanEmptySession: number;
            /** 清空无效的session间隔,单位为秒 */
            IntervalCleanUnusedSession: number;
            Exception: ExceptionConstructor
        }
    }
}
