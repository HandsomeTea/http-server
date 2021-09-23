import { Instances, Sessions } from '../models';

class SessionService {
    constructor() {
        this._init();
    }

    _init() {
        setInterval(() => {
            if (global.isServerRunning) {
                Sessions.deleteEmptyData();
            }
        }, global.IntervalCheckEmptySession * 1000);

        setInterval(async () => {
            if (global.isServerRunning) {
                const unusedInstance = await Instances.getUnusedInstance();

                if (unusedInstance.length > 0) {
                    await Sessions.deleteSessionBesidesAliveInstances(unusedInstance);
                    await Instances.deleteUnusedInstance(unusedInstance);
                }
            }
        }, global.IntervalCleanSessionOfInstance * 1000);
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
