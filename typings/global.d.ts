import { MyWebSocket, WebSocketServer } from '../websocket';

/**global变量 */
declare global {
    namespace NodeJS {
        interface Global {
            isServerRunning: boolean
            Exception: ExceptionConstructor
            tenantDBModel: Record<string, any>
        }
    }
}
