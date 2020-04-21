const request = require('./request');

class Request {
    constructor() {

    }

    async sendBaidu(method, url, options = { query: {}, header: {}, body: {} }) {
        return await request.send(url, method, options, 'www.baidu.com');
    }
}

module.exports = new class HTTP extends Request {
    constructor() {
        super();
        this._init();
    }

    _init() {

    }

    async search() {
        return await this.sendBaidu('post', '/search', { query: { s: 'test' } });
    }
};