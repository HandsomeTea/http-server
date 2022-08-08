import { Instances } from '@/dal';

class InstanceService {
    constructor() {
        this.init();
    }

    private async init() {
        /**instance保活维护 */
        await Instances.insertSystemInstance();
        setInterval(() => Instances.upsertSystemInstance(), global.IntervalUpdateInstance * 1000);

        /** 删除无效的instance */
        setInterval(async () => {
            Instances.deleteUnusedInstance();
        }, global.IntervalCleanUnusedInstance * 1000);
    }
}

export default new InstanceService();
