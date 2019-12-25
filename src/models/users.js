const Base = require('./_base');

class User extends Base {
    constructor(collectionName) {
        const model = {
            _id: { type: String, required: true, trim: true },
            name: { type: String, default: '', required: true, trim: true },
            ff: { type: String, default: 'test', enum: ['test', 'pro', 'dev'] },
            dt: { type: Date, default: new Date() },
            test: {
                type: String,
                require: true,
                validate: {
                    validator: (value) => {
                        if (value) {
                            return true;
                        }

                        return false;
                    },
                    message: props => `${props.value} is not a valid phone number!`
                }
            }
        };

        super(collectionName, model);

        this._init();
    }

    _init() {

    }

    async upsertOne(query = {}, update = {}) {
        return await this.updateOne(query, { $set: update }, { upsert: true });
    }
}

module.exports = new User('users');