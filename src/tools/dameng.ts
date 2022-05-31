// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dmdb from 'dmdb';
import { getENV, system } from '@/configs';

export default new class DM {
    private service!: dmdb.Connection | undefined;
    private isReady = false;
    constructor() {
        if (getENV('DB_TYPE') !== 'dameng') {
            return;
        }
        this.isReady = false;
        this.init();
    }

    private async init() {
        const connectString = getENV('DM_URL');

        if (!connectString) {
            throw new Exception(`DM connect address is required but get ${connectString}`);
        }
        try {
            const pool = await dmdb.createPool({ connectString });

            this.service = await pool.getConnection();
            this.isReady = true;
            system('dmdb').info(`DM connected on ${connectString} success and ready to use.`);
        } catch (error) {
            system('dmdb').error(error);
        }
    }

    /**
     * 系统是否采用dameng作为数据库
     * @readonly
     * @private
     */
    private get isUseful() {
        return getENV('DB_TYPE') === 'dameng';
    }

    public get server() {
        if (!this.isUseful) {
            system('dmdb').warn(`require to use ${getENV('DB_TYPE')}, but call dameng db! dameng db is not available!`);
        }
        return this.service;
    }

    public get isOK() {
        return !this.isUseful || this.isUseful && this.isReady;
    }

    public async close(): Promise<void> {
        if (this.isUseful) {
            await this.service?.close();
            this.isReady = false;
        }
    }
};
