const ioredis = require('ioredis');

const { system, audit } = require('../../src/configs');

class Redis {
    constructor() {
        this._init();
    }

    _init() {
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

    get redis() {
        return new ioredis(process.env.REDIS_URL, {
            enableReadyCheck: true,
            retryStrategy: function () {
                // do something when connection is disconnected
                system('redis').fatal('disconnected! connection is break off.');
            }
        });
    }

    get status() {
        return this.redis.status === 'ready' || this.redis.status === 'connecting';
    }

    async close() {
        return await this.redis.quit();
    }
}

module.exports = new Redis();
