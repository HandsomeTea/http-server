const { db, schema } = require('../mongo');


class Users {
    constructor() {
        this._users = db.model('users', new schema(this._model()), 'users');
        this.users = db.collection('users');

        this._init();
    }

    _init() {

    }

    _model() {
        return {
            name: { type: String, default: '', required: true, trim: true },
            field: { type: String, default: 'test', enum: ['test', 'pro', 'dev'] }
        };
    }

    async findAll() {
        return await this.users.find({}).toArray();
    }

    async insert() {
        const _a = new this._users({
            name: '333',
            field: 'dev',
            tests: 123
        });

        return await _a.save(_a);
    }

    async modelFindAll() {
        return await this._users.find({});
    }
}

const users = new Users();

Object.freeze(users);
Object.defineProperty(users, 'users', { configurable: false, writable: false });
Object.defineProperty(users, '_users', { configurable: false, writable: false });

module.exports = users;
