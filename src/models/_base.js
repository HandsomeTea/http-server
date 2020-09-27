const { ObjectId } = require('mongoose').Types;
const _ = require('underscore');
const httpContext = require('express-http-context');
const { db, schema } = require('../db/mongo');
const { isString, isArray, isObject, isEmptyObj } = require('../utils');

exports.BaseDB = class BaseDB {
    /**
     * Creates an instance of BaseDb.
     * @param {string} _collectionName mongodb的集合(表)名称，如果分租户，则不应该包含租户tenantId
     * @param {object} _model mongodb的集合(表)结构
     * @param {array} [_index=[]] mongodb的集合(表)索引
     * @param {string} [_tenantId=''] mongodb的集合(表)如果分租户，则表示该集合(表)属于哪个tenantId(集合/表的前缀)
     */
    constructor(_collectionName, _model, _index = [], _tenantId = '') {
        this.collectionName = _collectionName;
        this.schemaModel = _model;
        this.indexList = _index;
        this.tenantId = _tenantId;
    }

    get model() {
        const name = (httpContext.get('tenantId') ? httpContext.get('tenantId') + '-' : '') + this.collectionName;
        const _schema = new schema(this.schemaModel, { _id: false, versionKey: false, timestamps: { createdAt: true, updatedAt: '_updatedAt' } });
        const _index = this.indexList;

        for (let i = 0; i < _index.length; i++) {
            if (!_.isArray(_index[i])) {
                _schema.index(_index[i]);
            } else {
                _schema.index(..._index[i]);
            }
        }
        return db.model(name, _schema, name);
    }

    /**
     * @param {array|object} _data
     * @returns
     */
    _id(_data) {
        _data = [].concat(_data);
        for (let i = 0; i < _data.length; i++) {
            if (!isString(_data[i]._id) || isString(_data[i]._id) && _data[i]._id.trim() === '') {
                _data[i]._id = ObjectId().toString();
            }
        }
        return _data;
    }

    /**
     * @param {array|object} data
     * @returns
     */
    async create(data) {
        if (!isArray(data)) {
            return (await new this.model(this._id(data)[0]).save())._id;
        } else {
            return (await this.model.insertMany(this._id(data))).map(_result => _result._id);
        }
    }

    async removeOne(query = {}) {
        return (await this.model.deleteOne(query)).deletedCount;
    }

    async removeMany(query = {}) {
        return (await this.model.deleteMany(query)).deletedCount;
    }

    async updateOne(query = {}, set = {}, option = {}) {
        return (await this.model.updateOne(query, set, option)).nModified;
    }

    async upsertOne(query = {}, update = {}, options = {}) {
        return await this.updateOne(query, update, { ...options, upsert: true });
    }

    async updateMany(query = {}, set = {}, option = {}) {
        return (await this.model.updateMany(query, set, option)).nModified;
    }

    async upsertMany(query = {}, update = {}, option = {}) {
        return (await this.model.updateMany(query, update, { ...option, upsert: true })).nModified;
    }

    async find(query = {}, option = {}) {
        return await this.model.find(query, option);
    }

    async findOne(query = {}, option = {}) {
        return await this.model.findOne(query, option);
    }

    async findById(_id = '') {
        return await this.model.findById(_id);
    }

    async paging(query = {}, sort = {}, skip = 0, limit = 0, option = {}) {
        return await this.model.find(query, option).sort(sort).skip(skip).limit(limit);
    }

    async count(query = {}) {
        if (query && isObject(query) && !isEmptyObj(query)) {
            return await this.model.countDocuments(query);
        } else {
            return await this.model.estimatedDocumentCount();
        }
    }

    async aggregate(aggregations = []) {
        return await this.model.aggregate(aggregations);
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
