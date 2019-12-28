const { ObjectId } = require('mongoose').Types;
const _ = require('underscore');
const { db, schema } = require('../db/mongo');

module.exports = class BaseDB {
    constructor(_collectionName, _model) {
        this.collection = db.collection(_collectionName);
        this.model = db.model(_collectionName, new schema(_model, { _id: false, timestamps: { createdAt: true, updatedAt: '_updatedAt' } }), _collectionName);
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
        if (_.isObject(data)) {
            return (await new this.model(this._id(data)[0]).save())._id;
        } else {
            return (await this.model.insertMany(this._id(data))).map(_result => _result._id);
        }
    }

    async remove(query = {}) {
        return (await this.model.deleteOne(query)).deletedCount;
    }

    async removeMany(query = {}) {
        return (await this.model.deleteMany(query)).deletedCount;
    }

    async updateOne(query = {}, set = {}, option = {}) {
        return (await this.model.updateOne(query, set, option)).nModified;
    }

    async updateMany(query = {}, set = {}, option = {}) {
        return (await this.model.updateMany(query, set, option)).nModified;
    }

    async find(query = {}, option = {}) {
        return await this.model.find(query, option);
    }

    async findOne(query = {}, option = {}) {
        return await this.model.findOne(query, option);
    }

    async findById(_id) {
        return await this.model.findById(_id);
    }

    async paging(query = {}, sort = {}, skip = 0, limit = 0) {
        return await this.model.find(query).sort(sort).skip(skip).limit(limit);
    }

    async count(query = {}) {
        if (query && Object.keys(query).length > 0) {
            return await this.model.countDocuments(query);
        } else {
            return await this.model.estimatedDocumentCount();
        }
    }

    async aggregate(aggregations = []) {
        return await this.model.aggregate(aggregations);
    }
};
