const ioredis = require('ioredis');

const { system, audit } = require('../../src/configs');

class Redis {
    constructor() {

    }

    async init() {
        this.redis = new ioredis(process.env.REDIS_URL, {
            retryStrategy: function () {
                // do something when connection is disconnected
                system('redis').fatal('disconnected! connection is break off.');
            }
        });

        this.redis.on('connect', () => {
            system('redis').info(`connect on ${process.env.REDIS_URL} success and ready to use.`);
        });

        this.redis.on('close', () => {
            system('redis').fatal('disconnected! connection is break off. but still trying again');
        });

        this.redis.on('error', error => {
            system('redis').error(error.toString());
            audit('redis').error(error);
        });
    }

    get status() {
        return this.redis.status === 'ready';
    }

    async close() {
        return await this.redis.quit();
    }
}

module.exports = new Redis();
