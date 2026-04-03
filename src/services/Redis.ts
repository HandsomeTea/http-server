import redis from '@/tools/redis';

class RedisService {
    private expiredKeyMap: Record<string, number> = {};

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

    /**
     *
     * @param key
     * @param expire 单位：秒
     */
    private async setKeyExpire(key: string, expire: number) {
        if (!this.expiredKeyMap[key]) {
            this.expiredKeyMap[key] = expire;
            let timer: null | NodeJS.Timeout = setTimeout(() => {
                delete this.expiredKeyMap[key];

                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            }, expire * 1000);

            await redis.server?.expire(key, expire);
        }
    }

    async publishBundleLog(bundleRecordId: string, log: string, level?: 'debug' | 'info' | 'warning' | 'error') {
        const redisKey = this.bundleLogSavedKey(bundleRecordId);
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
        await this.setKeyExpire(redisKey, 8 * 60 * 60);
        if (log.includes('[#&log-end&#]')) {
            delete this.expiredKeyMap[redisKey];
        }
        await redis.server?.publish(subKey, log);
    }
}

export default new RedisService();
