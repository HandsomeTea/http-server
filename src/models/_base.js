const { ObjectId } = require('mongoose').Types;
const _ = require('underscore');
const httpContext = require('express-http-context');
const { db, schema } = require('../db/mongo');

exports.BaseDB = class BaseDB {
    constructor(_collectionName, _model, _index = []) {
        this.modelMap = {};
        this.model = () => {
            const name = (httpContext.get('tenantId') ? httpContext.get('tenantId') + '-' : '') + _collectionName;

            if (!this.modelMap[name]) {
                const _schema = new schema(_model, { _id: false, versionKey: false, timestamps: { createdAt: true, updatedAt: '_updatedAt' } });

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

exports.BaseRedis = class BaseRedis {
    constructor() {
        this.redis = require('../db/redis').redis;
    }

    /**
     *
     *
     * @param {string} [key='']
     * @param {*} value
     * @param {boolean} [whenNotExist=true] 默认为true，表示当键不存在时进行操作
     * @param {number} [expiryTime=60] 默认为60
     * @param {boolean} [expiryAsSecond=true] 数据过期时间单位是否为秒，默认为true
     * @returns
     */
    async set(key = '', value, whenNotExist = true, expiryTime = 60, expiryAsSecond = true) {
        return await this.redis.set(key.toString(), JSON.stringify(value), expiryAsSecond === true ? 'EX' : 'PX', expiryTime, whenNotExist === true ? 'NX' : 'XX') === 'OK';
    }
    /**
     *
     *
     * @param {*} [dataObj={}]
     * @param {boolean} [whenNotExist=true] 默认为true
     * @param {number} [expiryTime=60] 默认为60
     * @param {boolean} [expiryAsSecond=true] 数据过期时间单位是否为秒，默认为true
     * @returns
     */
    async mset(dataObj = {}, whenNotExist = true, expiryTime = 60, expiryAsSecond = true) {
        for (let key in dataObj) {
            await this.set(key, dataObj[key], whenNotExist, expiryTime, expiryAsSecond);
        }
        return true;
    }
    /**
     *
     *
     * @param {*} key
     * @returns
     */
    async get(key) {
        return JSON.parse(await this.redis.get(key.toString()));
    }
    /**
     *
     *
     * @param {array} [keys=[]]
     * @param {boolean} [showNotExistKey=false] 是否汇总不存在的key集合，默认false
     * @param {boolean} [mapModel=false] 是否汇总为map的结构，默认false
     * @returns
     */
    async mget(keys = [], showNotExistKey = false, mapModel = false) {
        if (!showNotExistKey && !mapModel) {
            return _.without((await this.redis.mget(keys)).map(_r => JSON.parse(_r)), null);
        } else {
            let _res = [], _mapRes = {}, notExistKey = [];

            keys.map(async _key => {
                const r = await this.get(_key);

                if (r) {
                    if (mapModel) {
                        _mapRes[_key] = r;
                    } else {
                        _res.push(r);
                    }
                } else {
                    notExistKey.push(_key);
                }
            });

            if (showNotExistKey) {
                return {
                    result: mapModel ? _mapRes : _res,
                    no: notExistKey
                };
            } else {
                return mapModel ? _mapRes : _res;
            }
        }
    }

    /**
     *
     *
     * @param {String|Array} key 字符串或者字符串数组
     * @returns
     */
    async delete(key) {
        if (_.isArray(key)) {
            return await this.redis.del(...key);
        } else {
            return await this.redis.del(key);
        }
    }
};
