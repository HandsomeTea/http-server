export default class BaseDAL {
    private source!: DBServerType;

    constructor() {
        this.source = 'mongodb';
    }

    get db() {
        return this.source;
    }
}
