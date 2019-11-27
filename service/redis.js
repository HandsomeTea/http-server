const redis = require('redis');

class Redis {
    constructor() {
        this.redis = redis.createClient({ url: process.env.REDIS_URL || 'redis://192.168.1.153:6379' });

        this.redis.on('ready', () => {
            system('redis-connect').info('redis ready ro used.');
        });

        this.redis.on('end', () => {
            system('redis-connect').info('end');
        });

        this.redis.on('error', error => {
            system('redis-connect').error(`Error ${error}`);
            audit('redis-connect').error(`Error ${error}`);
        });

        this.redis.on('connect', () => {
            system('redis-connect').info('redis connect success.');
        });
    }

    async _async(_redisApiName, ...args) {
        return new Promise((resolve, reject) => {
            this.redis[_redisApiName](...args, (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            });
        });
    }

    async testSet() {
        return await this._async('set', 'string_key', '123123');
    }

    async testGet() {
        return await this._async('get', 'string_key');
    }
}

module.exports = new Redis();
