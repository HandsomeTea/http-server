import { Client } from '@elastic/elasticsearch';
import { getENV, system } from '@/configs';
import { protectedURL } from '@/utils';

export default new class Elasticsearch {
    private service!: Client;
    constructor() {
        if (!this.isUseful) {
            return;
        }
        this.init();
    }

    private init() {
        try {
            this.service = new Client({
                node: getENV('ES_URL').split(',')
            });
            system('elasticsearch').info(`elasticsearch connected on ${protectedURL(getENV('ES_URL').split(',')).join(',')} success and ready to use.`);
        } catch (error) {
            system('elasticsearch').error(error);
        }
    }

    private get isUseful() {
        return Boolean(getENV('ES_URL'));
    }

    public get server() {
        if (!this.isUseful) {
            system('elasticsearch').warn('there is no elasticsearch config, but call it! elasticsearch is not available!');
        }
        return this.service;
    }

    public get isOK() {
        return !this.isUseful || this.isUseful && this.service?.connectionPool.connections.find(a => a.status === this.service?.connectionPool.Connection.statuses.ALIVE);
    }

    public async close(): Promise<void> {
        await this.server?.close();
    }
};
