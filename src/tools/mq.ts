import amqp, { AmqpConnectionManager } from 'amqp-connection-manager';
import { getENV, system } from '@/configs';

export default new class MQ {
    public server: AmqpConnectionManager;
    constructor() {
        this.server = amqp.connect([getENV('MQ_URL')]);

        this.init();
    }

    private init() {
        this.server.on('connect', () => {
            system('mq').info(`mq connected on ${getENV('MQ_URL')} success and ready to use.`);
        });

        this.server.on('disconnect', e => {
            system('mq').error(e);
        });
    }

    public get isUseful() {
        return this.server.isConnected();
    }

    public async close(): Promise<void> {
        await this.server.close();
    }
};
