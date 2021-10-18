import { Sessions } from '@/models';

class SessionService {
    constructor() {
        this.init();
    }

    private init() {
        /** 清空空的session记录 */
        setInterval(() => Sessions.deleteEmptyData(), global.IntervalCleanEmptySession * 1000);
        /** 清空无效的session */
        setInterval(() => Sessions.deleteUnusedSession(), global.IntervalCleanUnusedSession * 1000);
    }

    async getSessionsByUserId(userId: string) {
        const userSession = await Sessions.findById(userId) as SessionModel;

        if (userSession) {
            return userSession.connections;
        }
        return [];
    }
}

export default new SessionService();
