import ioredis from 'ioredis';
import { system } from '@/configs';

const RECONNET_TIME = 5000;

export default new class Redis {
    public server!: ioredis.Redis;
    constructor() {
        this._init();
    }

    private _init(): void {
        this.server = new ioredis(process.env.REDIS_URL, {
            enableReadyCheck: true,
            retryStrategy(times) {
                if (times <= 5) {
                    system('redis').fatal(`connection is break off! disconnect time is ${times} but still trying again after ${RECONNET_TIME}ms.`);
                    return RECONNET_TIME;
                }
                system('redis').fatal('connection is disconnected!');
                return;
            }
        });

        this.server.on('connect', () => {
            system('redis').info(`connect on ${process.env.REDIS_URL} success and ready to use.`);
        });

        this.server.on('error', error => {
            system('redis').error(error);
        });
    }

    public get status(): boolean {
        return this.server?.status === 'ready' || this.server?.status === 'connecting' || false;
    }

    public async close(): Promise<'OK'> {
        return await this.server.quit();
    }
};
