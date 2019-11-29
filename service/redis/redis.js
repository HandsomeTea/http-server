const redis = require('redis');

class Redis {
    constructor() {
        this.redis = null;

        this._init();
    }

    _init() {
        this.redis = redis.createClient({ url: process.env.REDIS_URL, retry_strategy: () => 5000 });/* eslint-disable-line camelcase*/

        this.redis.on('ready', () => {
            system('redis').info(`connect on ${process.env.REDIS_URL} success and ready to use.`);
        });

        this.redis.on('end', () => {
            system('redis').fatal('disconnected! connection is break off.');
        });

        this.redis.on('error', error => {
            system('redis').error(error.toString());
            audit('redis').error(error);
        });

        this.redis.on('connect', () => {
            system('redis').trace('connect success.');
        });
    }

    async _async(_redisApiName, ...args) {
        return new Promise((resolve, reject) => {
            this.redis[_redisApiName](...args, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
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
