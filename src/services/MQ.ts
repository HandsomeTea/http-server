import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';

import mq from '@/tools/mq';

import { log } from '@/configs';

type MQConsumeExchange = 'surpass.addressbook.exchange'

type MQPublishExchange = 'surpass.callmasterevent.exchange'

class MQService {
    private publishChannelMap: Map<string, ChannelWrapper>;

    constructor() {
        this.publishChannelMap = new Map();

        this.observeChannel('surpass.addressbook.exchange', 'surpass.addressbook.queue.ddpadaptor');
    }

    private async observeChannel(exchange: MQConsumeExchange, queue: string, type?: 'fanout' | 'direct'): Promise<void> {
        queue += `.${process.env.INSTANCEID}`;

        mq.server?.createChannel({
            setup: (channel: ConfirmChannel) =>
                Promise.all([
                    channel.assertExchange(exchange, type || 'fanout', { durable: true }),
                    channel.assertQueue(queue, {
                        exclusive: false,
                        arguments: { 'x-expires': 6 * 60 * 1000, 'x-message-ttl': 5 * 60 * 1000 }
                    }),
                    channel.bindQueue(queue, exchange, type ? process.env.INSTANCEID as string : ''),
                    channel.consume(queue, this.consumeChannelMessage, { noAck: true })
                ])
        });
    }

    private async consumeChannelMessage(data: ConsumeMessage | null): Promise<void> {
        const message = data?.content.toString();

        if (!message) {
            return;
        }
        let objContent: {
            eventname: 'trans_proxy_event' | 'devicemgr_event'
            type: 'surpass-notify-user' | 'surpass-notify-device' | 'surpass-notify-tenant'
            id: string | Array<string>
            params: {
                event: 'logout_clients' | 'logout_user' | 'user_info_change' | 'logout_tenant' | 'device_register' | 'close_connection'
                [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
            }
        } | null = null;

        try {
            objContent = JSON.parse(message);
        } catch (e) {
            return log('MQ').error(`invalid message: ${message}`);
        }

        if (!objContent) {
            return;
        }
        log('mq-received-message').info(JSON.stringify(objContent, null, '   '));

        // do something
    }

    public async publish(exchange: MQPublishExchange, message: Record<string, any> | Buffer, options = {}): Promise<void> { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (mq.server?.isConnected()) {
            if (!this.publishChannelMap.get(exchange)) {
                const channelSend = mq.server.createChannel({
                    json: true,
                    setup: (channel: ConfirmChannel) => channel.assertExchange(exchange, 'fanout', {
                        durable: true
                    })
                });

                this.publishChannelMap.set(exchange, channelSend);
            }

            try {
                await this.publishChannelMap.get(exchange)?.publish(exchange, '', message, options);
            } catch (err) {
                this.publishChannelMap.get(exchange)?.close();
                this.publishChannelMap.delete(exchange);
            }
        }
    }

    async sendCallMasterEvent(params: {
        serialNumber?: string
        type?: 'guest' | 'system-user'
        userId?: string
        tenantId?: string
        connectionId?: string
        unusedInstances?: Array<string>
    }, event: 'device_offline' | 'server_restart') {
        await this.publish('surpass.callmasterevent.exchange', {
            params,
            event,
            eventname: 'callmaster_event'
        }, params.userId ? {
            'headers': {
                'x-user': params.userId,
                'x-tenantId': params.tenantId,
                'x-instanceId': process.env.INSTANCEID,
                'x-connectionId': params.connectionId
            }
        } : {});
    }
}

export default new MQService();
