const Base = require('./_base');

class User extends Base {
    constructor(collectionName) {
        const model = {
            _id: { type: String, required: true, trim: true },
            name: { type: String, default: '', required: true, trim: true },
            ff: { type: String, default: 'test', enum: ['test', 'pro', 'dev'] },
            dt: { type: Date, default: new Date() }
        };

        super(collectionName, model);

        this._init();
    }

    _init() {

    }

    async test(test) {
        return await this.insertMany(test);
    }
}

module.exports = new User('users');
