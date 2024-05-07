import amqp, { AmqpConnectionManager } from 'amqp-connection-manager';
import { getENV, system } from '@/configs';

export default new class MQ {
    private service: AmqpConnectionManager | undefined;
    constructor() {
        if (!this.isUseful) {
            return;
        }
        this.init();
    }

    private init() {
        this.service = amqp.connect([getENV('MQ_URL')]);
        this.service.on('connect', () => {
            system('mq').info(`mq connected on ${getENV('MQ_URL')} success and ready to use.`);
        });

        this.service.on('disconnect', e => {
            system('mq').error(e);
        });
    }

    private get isUseful() {
        return Boolean(getENV('MQ_URL'));
    }

    public get server() {
        if (!this.isUseful) {
            system('mq').warn('there is no mq config, but call it! mq is not available!');
        }
        return this.service;
    }

    public get isOK() {
        return !this.isUseful || this.isUseful && this.service?.isConnected();
    }

    public async close(): Promise<void> {
        await this.server?.close();
    }
};
