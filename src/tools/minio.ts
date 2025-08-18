import { Client } from 'minio';
import { getENV, system } from '@/configs';

export default new class Minio {
    private service: Client | null = null;
    private _isOK: boolean = false;

    constructor() {
        if (!this.isUseful) {
            return;
            // throw new Error('minio is required! please use environment(MINIO_URL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY) to config it!');
        }
        this.init();
    }

    private async init() {
        const minioUrl = getENV('MINIO_URL');
        const minioAccessKey = getENV('MINIO_ACCESS_KEY');
        const minioSecretKey = getENV('MINIO_SECRET_KEY');
        const url = new URL(minioUrl);

        try {
            this.service = new Client({
                endPoint: url.hostname,
                port: parseInt(url.port),
                useSSL: false,
                accessKey: minioAccessKey,
                secretKey: minioSecretKey
            });

            await this.service.bucketExists('test');
            this._isOK = true;
            url.username = '***';
            url.password = '***';
            system('monio').info(`minio connected on ${url.toString()} success and ready to use.`);
        } catch (e) {
            system('monio').error(`minio connected on ${url.toString()} error:`);
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }

    private get isUseful() {
        return Boolean(getENV('MINIO_URL')) && Boolean(getENV('MINIO_ACCESS_KEY')) && Boolean(getENV('MINIO_SECRET_KEY'));
    }

    public get server() {
        if (!this.isUseful) {
            system('minio').warn('there is no minio config, but call it! minio is not available!');
        }
        return this.service;
    }

    public get isOK() {
        return this._isOK;
    }

    public close() {
        this.service = null;
    }
};
