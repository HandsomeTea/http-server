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
        const redisKey = this.bundleLogSavedKey(bundleRecordId);

        if (log.includes('[#&log-end&#]')) {
            await redis.server?.expire(redisKey, 8 * 60 * 60);
            return;
        }
        const subKey = this.bundleLogSubChannel(bundleRecordId);

        if (level === 'error') {
            log = `\x1B[91;1m${log}\x1B[0;m\n`;
        } else if (level === 'warning') {
            log = `\x1B[0;33m${log}\x1B[0;m\n`;
        } else if (level === 'info') {
            log = `\x1B[32;1m${log}\x1B[0;m\n`;
        } else if (level === 'debug') {
            log = `\x1B[36;1m${log}\x1B[0;m\n`;
        }
        await redis.server?.rpush(redisKey, log);
        await redis.server?.publish(subKey, log);
    }
}

export default new RedisService();
