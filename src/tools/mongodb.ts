import mongoose from 'mongoose';
import { getENV, system } from '@/configs';

const RECONNET_TIME = 5000;
const mongoconnect = () => {
    const mongodbAddress = getENV('DB_URL');

    if (!mongodbAddress) {
        return system('mongodb').error(`mongodb connect address is required but get ${mongodbAddress}`);
    }
    return mongoose.connect(mongodbAddress, {}, error => {
        if (error) {
            system('mongodb').error(error);
            setTimeout(mongoconnect, RECONNET_TIME);
        }
    });
};

export default new class MongoDB {
    constructor() {
        if (!this.isUseful) {
            return;
        }
        // 初始化操作
        this.server.once('connected', () => {// 连接成功
            system('mongodb').info(`mongodb connected on ${getENV('DB_URL')} success and ready to use.`);
        });

        this.server.on('disconnected', () => {// 连接失败或中断
            system('mongodb').fatal(`disconnected! connection is break off. it will be retried in ${RECONNET_TIME} ms after every reconnect until success unless process exit.`);
        });

        this.server.on('reconnected', () => {// 重新连接成功
            system('mongodb').info(`reconnect on ${getENV('DB_URL')} success and ready to use.`);
        });

        this.init();
    }

    private async init() {
        return await mongoconnect();
    }

    /**
     * 系统是否采用mongodb作为数据库
     * @readonly
     * @private
     */
    private get isUseful() {
        return getENV('DB_TYPE') === 'mongodb';
    }

    public get server() {
        if (!this.isUseful) {
            system('mongodb').warn(`require to use ${getENV('DB_TYPE')}, but call mongodb! mongodb is not available!`);
        }
        return mongoose.connection;
    }

    public get schema() {
        return mongoose.Schema;
    }

    public get isOK() {
        return !this.isUseful || this.isUseful && this.server.readyState === 1;
    }

    public async close(): Promise<void> {
        if (this.isUseful) {
            await this.server.close();
        }
    }
};
