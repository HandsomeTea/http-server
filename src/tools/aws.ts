import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { getENV, system } from '@/configs';


export default new class Ceph {
    private service: S3Client | null = null;
    private _isOK: boolean = false;

    constructor() {
        if (!this.isUseful) {
            return;
            // throw new Error('aws oss is required! please use environment(AWS_URL, AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY) to config it!');
        }
        this.init();
    }

    private async init() {
        const region = getENV('AWS_REGION');
        const endpoint = getENV('AWS_URL');
        const accessKeyId = getENV('AWS_ACCESS_KEY');
        const secretAccessKey = getENV('AWS_SECRET_KEY');

        try {
            this.service = new S3Client({
                region,
                endpoint,
                credentials: {
                    accessKeyId,
                    secretAccessKey
                }
            });

            const command = new ListBucketsCommand({});

            await this.service.send(command);
            this._isOK = true;
            system('aws').info(`aws oss connected on ${endpoint} success and ready to use.`);
        } catch (e) {
            system('aws').error(`aws oss connected on ${endpoint} error:`);
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }

    private get isUseful() {
        return Boolean(getENV('AWS_URL')) && Boolean(getENV('AWS_REGION')) && Boolean(getENV('AWS_ACCESS_KEY')) && Boolean(getENV('AWS_SECRET_KEY'));
    }

    public get server() {
        if (!this.isUseful) {
            system('aws oss').warn('there is no aws oss config, but call it! aws oss is not available!');
        }
        return this.service;
    }

    public get isOK() {
        return !this.isUseful || this.isUseful && this._isOK;
    }

    public close() {
        this.service?.destroy();
        this.service = null;
    }
}
