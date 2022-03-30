import ioredis from 'ioredis';
import { getENV, system } from '@/configs';

const RECONNET_TIME = 5000;

export default new class Redis {
    public server!: ioredis;
    constructor() {
        this.init();
    }

    private init(): void {
        this.server = new ioredis(getENV('REDIS_URL') as string, {
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
            system('redis').info(`redis connected on ${getENV('REDIS_URL')} success and ready to use.`);
        });

        this.server.on('error', error => {
            system('redis').error(error);
        });
    }

    public get isUseful() {
        return this.server?.status === 'ready';
    }

    public async close(): Promise<'OK'> {
        return await this.server.quit();
    }
};
