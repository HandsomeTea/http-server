const { db, schema } = require('../mongo');

module.exports = class BaseDB {
    constructor(collectionName, model) {
        this.collection = db.collection(collectionName);
        this.model = db.model(collectionName, new schema(model), collectionName);
    }

    async insertOne(data = {}) {
        return await this.model.create(data);
    }

    async insert(messages = []) {
        return await this.model.insertMany(messages);
    }

    //
    async removeOne(query = {}) {
        return await this.model.deleteOne(query);
    }

    async remove(query = {}) {
        const { deletedCount } = await this.model.deleteMany(query);

        return deletedCount;
    }

    async updateOne(query = {}, set = {}, option = {}) {
        return await this.model.updateOne(query, set, option);
    }

    async update(query = {}, set = {}, option = {}) {
        return await this.model.updateMany(query, set, option);
    }

    async find(query = {}, option = {}) {
        return await this.model.find(query, option);
    }

    async findOne(query = {}, option = {}) {
        return await this.model.findOne(query, option);
    }
};
