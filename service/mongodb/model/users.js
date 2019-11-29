const { db, schema } = require('../mongo');


module.exports = new class Users {
    constructor() {
        this._users = null;
        this.users = null;
        this._init();
    }

    _init() {
        const _modelUsersTable = db.model('users', new schema(this._model()), 'users');
        const _originUserTable = db.collection('users');

        this._users = _modelUsersTable;
        this.users = _originUserTable;
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
};
