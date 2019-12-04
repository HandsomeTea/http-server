const Base = require('./_base');

class User extends Base {
    constructor(collectionName) {
        const model = {
            name: { type: String, default: '', required: true, trim: true },
            ff: { type: String, default: 'test', enum: ['test', 'pro', 'dev'] },
            dt: { type: Date, default: new Date() }
        };

        super(collectionName, model);

        this._init();
    }

    _init() {

    }

    async findTest(test) {
        return await this.find({ test });
    }
}

module.exports = new User('users');
