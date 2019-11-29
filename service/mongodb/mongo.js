const mongoose = require('mongoose');

const RECONNET_TIME = 5000; // Reconnect every 5000ms
const _connect = () => {
    mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        autoReconnect: true,
        poolSize: 100,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: RECONNET_TIME
    }).catch(() => {
        setTimeout(_connect, RECONNET_TIME);
    });
};

class MongoDB {
    constructor() {
        this.db = null;
        this.schema = mongoose.Schema;
        this._init();
    }

    _init() {
        const _db = mongoose.connection;

        // 连接成功
        _db.once('connected', () => {
            system('mongodb').info(`connect on ${process.env.MONGO_URL} success and ready to use.`);
        });
        // 连接失败或中断
        _db.on('disconnected', () => {
            system('mongodb').fatal(`disconnected! connection is break off. it will be retried in ${RECONNET_TIME} ms after every reconnect until success.`);
        });
        // 重新连接成功
        _db.on('reconnected', () => {
            system('mongodb').info(`reconnect on ${process.env.MONGO_URL} success and ready to use.`);
        });
        this.db = _db;
        _connect();
    }
}

module.exports = new MongoDB();
