const mongoose = require('mongoose');

const { system } = require('../../src/configs');

const RECONNET_TIME = 5000; // Reconnect every 5000ms

let _retry = null; /* eslint-disable-line no-unused-vars*/
const _connect = async () => {
    return await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        autoReconnect: true,
        poolSize: 100,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: RECONNET_TIME
    }).catch(() => {
        _retry = setTimeout(_connect, RECONNET_TIME);
    });
};


class MongoDB {
    constructor() {
        this.db.once('connected', () => {// 连接成功
            system('mongodb').info(`connect on ${process.env.MONGO_URL} success and ready to use.`);
            _retry = null;
        });

        this.db.on('disconnected', () => {// 连接失败或中断
            system('mongodb').fatal(`disconnected! connection is break off. it will be retried in ${RECONNET_TIME} ms after every reconnect until success unless process exit.`);
        });

        this.db.on('reconnected', () => {// 重新连接成功
            system('mongodb').info(`reconnect on ${process.env.MONGO_URL} success and ready to use.`);
        });
    }

    async init() {
        return await _connect();
    }

    get db() {
        return mongoose.connection;
    }

    get schema() {
        return mongoose.Schema;
    }

    get status() {
        return this.db.readyState === 1;
    }

    async close() {
        return await mongoose.connection.close();
    }
}

module.exports = new MongoDB();
