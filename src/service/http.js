const axios = require('axios');
const httpContext = require('express-http-context');

const { errorType, traceId, log } = require('../configs');
const { JWT } = require('../service');

class Request {
    constructor() {

    }

    async send(url, method, baseURL, options = { params: {}, data: {}, headers: {} }) {
        let data = null;

        try {
            data = (await axios.request({
                url,
                method,
                baseURL,
                headers: {
                    Authorization: JWT.sign(),
                    'X-B3-SpanId': traceId(),
                    'X-B3-TraceId': httpContext.get('traceId') || traceId(),
                    'X-B3-ParentSpanId': httpContext.get('spanId') || traceId(),
                    'x-tenantId': httpContext.get('tenantId') || '',
                    ...options.headers
                },
                params: options.params,
                data: options.data
            })).data;
        } catch (error) {
            log(`send-${baseURL}`).error(error);
            throw new Exception(error.message);
        }
        if (data.status) {
            if (data.status >= 200 && data.status < 210) {
                return data.data;
            } else {
                log(`send-${baseURL}`).error(data.type);
                throw new Exception('not success', data.type);
            }
        } else {
            throw new Exception('server error: url not found', errorType.URL_NOT_FOUND);
        }
    }

    async sendBaidu(method, url, options = { params: {}, data: {}, headers: {} }) {
        return await this.send(url, method, 'www.baidu.com', options);
    }
}

class HTTP extends Request {
    constructor() {
        super();
        this._init();
    }

    _init() {

    }

    async search() {
        return await this.sendBaidu('post', '/search', { params: { s: 'test' } });
    }
}

module.exports = new HTTP();
