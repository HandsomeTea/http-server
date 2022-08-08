import { MyWebSocket, WebSocketServer } from '../websocket';

/**global变量 */
declare global {
    namespace NodeJS {
        interface Global {
            isServerRunning: boolean
            Exception: ExceptionConstructor
            tenantDBModel: Record<string, any>
            /** 清空无效的instance间隔,单位为秒 */
            IntervalCleanUnusedInstance: number
            /** instance保活间隔,单位为秒 */
            IntervalUpdateInstance: number
        }
    }
}
