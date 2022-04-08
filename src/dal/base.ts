import { getENV } from '@/configs';

export default class BaseDAL {
    private source!: DBServerType;

    constructor() {
        this.source = getENV('DB_TYPE');
    }

    get db() {
        return this.source;
    }
}
