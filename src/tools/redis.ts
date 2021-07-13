import ioredis from 'ioredis';
import { system, audit } from '../configs';

export default new class Redis {
    public server!: ioredis.Redis;
    constructor() {
        this._init();
    }

    private _init(): void {
        this.server = new ioredis(process.env.REDIS_URL, {
            enableReadyCheck: true,
            retryStrategy: function () {
                // do something when connection is disconnected
                system('redis').fatal('disconnected! connection is break off.');
            }
        });

        this.server.on('connect', () => {
            system('redis').info(`connect on ${process.env.REDIS_URL} success and ready to use.`);
        });

        this.server.on('close', () => {
            system('redis').fatal('disconnected! connection is break off. but still trying again');
        });

        this.server.on('error', error => {
            system('redis').error(error.toString());
            audit('redis').error(error);
        });
    }

    public get status(): boolean {
        return this.server?.status === 'ready' || this.server?.status === 'connecting';
    }

    public async close(): Promise<'OK'> {
        return await this.server.quit();
    }
};
