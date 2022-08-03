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
}

export default new RedisService();
