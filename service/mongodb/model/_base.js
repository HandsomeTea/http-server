const { ObjectId } = require('mongoose').Types;
const _ = require('underscore');
const { db, schema } = require('../mongo');

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

    async insertOne(data = {}) {
        return await new this.model(this._id(data)[0]).save();
    }

    async insert(data = []) {
        return await this.model.insertMany(this._id(data));
    }

    async removeOne(query = {}) {
        return (await this.model.deleteOne(query)).deletedCount;
    }

    async remove(query = {}) {
        return (await this.model.deleteMany(query)).deletedCount;
    }

    async updateOne(query = {}, set = {}, option = {}) {
        return (await this.model.updateOne(query, set, option)).nModified;
    }

    async update(query = {}, set = {}, option = {}) {
        return (await this.model.updateMany(query, set, option)).nModified;
    }

    async find(query = {}, projection = {}) {
        return await this.model.find(query, projection);
    }

    async findOne(query = {}, projection = {}) {
        return await this.model.findOne(query, projection);
    }

    async findById(_id) {
        return await this.model.findById(_id);
    }
};
