import { getENV } from '@/configs';

export default class BaseDAL {
    private source!: DBServerType;

    constructor() {
        this.source = getENV('DB_TYPE');
    }

    get db() {
        if (this.source === 'mysql' || this.source === 'postgres') {
            return 'sqldb';
        }
        if (this.source === 'dameng') {
            return 'dmdb';
        }
        return 'mongodb';
    }
}
