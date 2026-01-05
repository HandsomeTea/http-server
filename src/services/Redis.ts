import redis from '@/tools/redis';

class RedisService {
    constructor() {
        //
    }

    async getBindingCodeRecord(bindingCode: string) {
        const resultStr = await redis.server?.get(`CORE_bindingNumber-${bindingCode}`);

        if (!resultStr) {
            return {};
        }
        const result = JSON.parse(resultStr) as { userid: string, type: 'admin' | 'user' };

        return {
            userId: result.userid,
            bindingType: result.type
        };
    }

    bundleLogSubChannel(bundleRecordId: string) {
        return `bundle:log:${bundleRecordId}:sub`;
    }

    private bundleLogSavedKey(bundleRecordId: string) {
        return `bundle:log:${bundleRecordId}`;
    }

    async publishBundleLog(bundleRecordId: string, log: string, level?: 'debug' | 'info' | 'warning' | 'error') {
        const subKey = this.bundleLogSubChannel(bundleRecordId);
        const redisKey = this.bundleLogSavedKey(bundleRecordId);

        if (level === 'error') {
            log = `[31;1m${log}[0;m\n`;
        } else if (level === 'warning') {
            log = `[0;33m${log}[0;m\n`;
        } else if (level === 'info') {
            log = `[32;1m${log}[0;m\n`;
        } else if (level === 'debug') {
            log = `[36;1m${log}[0;m\n`;
        }
        await redis.server?.rpush(redisKey, log);
        await redis.server?.publish(subKey, log);
    }
}

export default new RedisService();
