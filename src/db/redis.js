const ioredis = require('ioredis');

const { system, audit } = require('../../config/logger.config');

class Redis {
    constructor() {
        let _status = false;

        this.redisStatus = () => {
            return _status;
        };

        this.redis.on('connect', () => {
            system('redis').info(`connect on ${process.env.REDIS_URL} success and ready to use.`);
            _status = true;
        });

        this.redis.on('close', () => {
            system('redis').fatal('disconnected! connection is break off. but still trying again');
            _status = false;
        });

        this.redis.on('error', error => {
            system('redis').error(error.toString());
            audit('redis').error(error);
            _status = false;
        });

        this.quitRedis = async () => {
            await this.redis.quit();
            _status = false;
        };

        this._init();
    }

    _init() {

    }

    get redis() {
        return new ioredis(process.env.REDIS_URL, {
            retryStrategy: function () {
                // do something when connection is disconnected
                system('redis').fatal('disconnected! connection is break off.');
            }
        });
    }
}

const _redis = new Redis();

Object.defineProperty(_redis, 'redisStatus', { writable: false });
Object.defineProperty(_redis, 'quitRedis', { writable: false });

module.exports = _redis;
