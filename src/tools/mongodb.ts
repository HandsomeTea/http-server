import mongoose from 'mongoose';
import { system } from '../configs';

const RECONNET_TIME = 5000;
const _mongoconnect = async () => {
    const mongodbAddress = process.env.MONGO_URL;

    if (!mongodbAddress) {
        return system('mongodb').info(`connect address is required but get ${mongodbAddress}`);
    }

    return await mongoose.connect(mongodbAddress, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        autoReconnect: true,
        /** Set to `true` to make Mongoose automatically call `createCollection()` on every model created on this connection. */
        autoCreate: false,
        poolSize: 100,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: RECONNET_TIME
    }).catch(error => {
        system('connect-error-mongodb').error(error);
        setTimeout(_mongoconnect, RECONNET_TIME);
    });
};

class MongoDB {
    constructor() {
        // 初始化操作
        this.server.once('connected', () => {// 连接成功
            system('mongodb').info(`connect on ${process.env.MONGO_URL} success and ready to use.`);
        });

        this.server.on('disconnected', () => {// 连接失败或中断
            system('mongodb').fatal(`disconnected! connection is break off. it will be retried in ${RECONNET_TIME} ms after every reconnect until success unless process exit.`);
        });

        this.server.on('reconnected', () => {// 重新连接成功
            system('mongodb').info(`reconnect on ${process.env.MONGO_URL} success and ready to use.`);
        });

        this._init();
    }

    private async _init() {
        return await _mongoconnect();
    }

    public get server() {
        return mongoose.connection;
    }

    public get schema() {
        return mongoose.Schema;
    }

    public get status() {
        return this.server.readyState === 1;
    }

    public async close() {
        return await mongoose.connection.close();
    }
}

export default new MongoDB();
