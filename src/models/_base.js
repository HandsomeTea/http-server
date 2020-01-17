const { ObjectId } = require('mongoose').Types;
const _ = require('underscore');
const httpContext = require('express-http-context');
const { db, schema } = require('../db/mongo');

module.exports = class BaseDB {
    constructor(_collectionName, _model, _index = []) {
        this.modelMap = {};
        this.model = () => {
            const name = (httpContext.get('tenantId') ? httpContext.get('tenantId') + '-' : '') + _collectionName;

            if (!this.modelMap[name]) {
                const _schema = new schema(_model, { _id: false, timestamps: { createdAt: true, updatedAt: '_updatedAt' } });

                for (let i = 0; i < _index.length; i++) {
                    if (!_.isArray(_index[i])) {
                        _schema.index(_index[i]);
                    } else {
                        _schema.index(..._index[i]);
                    }
                }
                this.modelMap[name] = db.model(name, _schema, name);

                setTimeout(() => {
                    delete this.modelMap[name];
                }, 30 * 60 * 1000);
            }
            return this.modelMap[name];
        };
    }

    _id(_data) {
        _data = [].concat(_data);
        for (let i = 0; i < _data.length; i++) {
            if (!_.isString(_data[i]._id) || _.isString(_data[i]._id) && _data[i]._id.trim() === '') {
                _data[i]._id = ObjectId().toString();
            }
        }
        return _data;
    }

    async create(data) {
        if (!_.isArray(data)) {
            const _model = this.model();

            return (await new _model(this._id(data)[0]).save())._id;
        } else {
            return (await this.model().insertMany(this._id(data))).map(_result => _result._id);
        }
    }

    async remove(query = {}) {
        return (await this.model().deleteOne(query)).deletedCount;
    }

    async removeMany(query = {}) {
        return (await this.model().deleteMany(query)).deletedCount;
    }

    async updateOne(query = {}, set = {}, option = {}) {
        return (await this.model().updateOne(query, set, option)).nModified;
    }

    async upsertOne(query, update, options = {}) {
        return await this.updateOne(query, update, _.extend(options, { upsert: true }));
    }

    async updateMany(query = {}, set = {}, option = {}) {
        return (await this.model().updateMany(query, set, option)).nModified;
    }

    async find(query = {}, option = {}) {
        return await this.model().find(query, option);
    }

    async findOne(query = {}, option = {}) {
        return await this.model().findOne(query, option);
    }

    async findById(_id) {
        return await this.model().findById(_id);
    }

    async paging(query = {}, sort = {}, skip = 0, limit = 0) {
        return await this.model().find(query).sort(sort).skip(skip).limit(limit);
    }

    async count(query = {}) {
        if (query && !_.isEmpty(query)) {
            return await this.model().countDocuments(query);
        } else {
            return await this.model().estimatedDocumentCount();
        }
    }

    async aggregate(aggregations = []) {
        return await this.model().aggregate(aggregations);
    }
};
