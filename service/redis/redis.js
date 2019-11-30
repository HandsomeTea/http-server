const redis = require('redis');

class Redis {
    constructor() {
        // 属性定义
        this.redis = redis.createClient({ url: process.env.REDIS_URL, retry_strategy: () => 5000 });/* eslint-disable-line camelcase*/
        let _status = false;

        this.redisStatus = () => {
            return _status;
        };

        // 初始操作
        this.redis.on('ready', () => {
            system('redis').info(`connect on ${process.env.REDIS_URL} success and ready to use.`);
            _status = true;
        });

        this.redis.on('end', () => {
            system('redis').fatal('disconnected! connection is break off. will try to reconnect.');
            _status = false;
        });

        this.redis.on('error', error => {
            system('redis').error(error.toString());
            audit('redis').error(error);
            _status = false;
        });

        this.redis.on('connect', () => {
            system('redis').trace('connect success.');
        });

        this._init();
    }

    _init() {

    }

    async quitRedis() {
        await this.redis.quit();
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

const _redis = new Redis();

Object.defineProperty(_redis, 'redis', { writable: false });
Object.defineProperty(_redis, 'redisStatus', { writable: false });

module.exports = _redis;
