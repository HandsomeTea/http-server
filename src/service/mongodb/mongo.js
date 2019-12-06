const mongoose = require('mongoose');

const RECONNET_TIME = 5000; // Reconnect every 5000ms

let _retry = null; /* eslint-disable-line no-unused-vars*/
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
        _retry = setTimeout(_connect, RECONNET_TIME);
    });
};


class MongoDB {
    constructor() {
        // 属性定义
        this.db = mongoose.connection;
        this.schema = mongoose.Schema;
        let _status = false;

        this.mongoStatus = () => {
            return _status;
        };

        // 初始化操作
        this.db.once('connected', () => {// 连接成功
            system('mongodb').info(`connect on ${process.env.MONGO_URL} success and ready to use.`);
            _retry = null;
            _status = true;
        });

        this.db.on('disconnected', () => {// 连接失败或中断
            system('mongodb').fatal(`disconnected! connection is break off. it will be retried in ${RECONNET_TIME} ms after every reconnect until success unless process exit.`);
            _status = false;
        });

        this.db.on('reconnected', () => {// 重新连接成功
            system('mongodb').info(`reconnect on ${process.env.MONGO_URL} success and ready to use.`);
            _status = true;
        });

        this._init();
    }

    _init() {
        _connect();
    }

    async closeMongoConnection() {
        _retry = null;
        await mongoose.connection.close();
    }
}

const _mongodb = new MongoDB();

Object.freeze(_mongodb);
Object.defineProperty(_mongodb, 'db', { configurable: false, writable: false });
Object.defineProperty(_mongodb, 'schema', { configurable: false, writable: false });
Object.defineProperty(_mongodb, 'mongoStatus', { configurable: false, writable: false });


module.exports = _mongodb;
