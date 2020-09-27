const axios = require('axios');
const httpContext = require('express-http-context');
const Agent = require('agentkeepalive');
const _ = require('underscore');

const { traceId, log } = require('../configs');
const JWT = require('./jwtService');
const { isString } = require('../utils');

class Request {
    constructor() {
        axios.defaults.timeout = 10000;
        axios.defaults.httpAgent = new Agent({
            keepAlive: true,
            maxSockets: 100,
            maxFreeSockets: 10,
            timeout: 60000, // active socket keepalive for 60 seconds
            freeSocketTimeout: 30000 // free socket keepalive for 30 seconds
        });

        // 请求拦截器
        axios.interceptors.request.use(this._beforeSendToServer, this._beforeSendToServerButError);

        // 响应拦截器
        axios.interceptors.response.use(this._receiveSuccessResponse, this._receiveResponseNotSuccess);
    }

    _beforeSendToServer(config) {
        if (!config.headers.Authorization) {
            config.headers.Authorization = JWT.sign();
        }

        if (!config.headers['X-B3-SpanId']) {
            config.headers['X-B3-SpanId'] = traceId();
        }

        if (!config.headers['X-B3-TraceId']) {
            config.headers['X-B3-TraceId'] = httpContext.get('traceId') || traceId();
        }

        if (!config.headers['X-B3-ParentSpanId']) {
            config.headers['X-B3-ParentSpanId'] = httpContext.get('spanId') || traceId();
        }

        if (!config.headers['x-tenantId']) {
            config.headers['x-tenantId'] = httpContext.get('tenantId') || '';
        }

        const zh = config.url.match(/[\u4e00-\u9fa5]/g);

        if (zh) {
            let _obj = {};

            for (let i = 0; i < zh.length; i++) {
                if (!_obj[zh[i]]) {
                    _obj[zh[i]] = encodeURIComponent(zh[i]);
                }
            }

            for (const key in _obj) {
                config.url = config.url.replace(new RegExp(key, 'g'), _obj[key]);
            }
        }

        const { url, baseURL, method, params, data, headers } = config;

        log('send-to-other-server').debug({
            target: `(${method}): ${baseURL ? baseURL + url : url}`,
            headers,
            params: params || {},
            data: data || {}
        });

        return config;
    }

    async _beforeSendToServerButError(error) {
        log('request-server').error(error);
        throw new Exception(error);
    }

    async _receiveSuccessResponse(response) {
        // 这里只处理 response.status >= 200 && response.status <= 207 的情况
        const { data/*, config, headers, request, status, statusText*/ } = response;

        return Promise.resolve(data);
    }

    async _receiveResponseNotSuccess(error) {
        // const { message, name, description, number, fileName, lineNumber, columnNumber, stack, code } = error.toJSON();
        const { response, config, request: { responseURL } } = error;

        let target = null;

        if (config) {
            const { url, baseURL, method } = config;

            target = `(${method}): ${baseURL ? baseURL + url : url}`;
        } else {
            target = responseURL;
        }
        const errorResult = {
            sendRequest: target,
            status: 500,
            type: 'INTERNAL_SERVER_ERROR'
        };

        if (response) {
            const { status, statusText, data } = response;

            _.extend(errorResult, {
                status,
                httpInfo: statusText,
                ...isString(data) ? { info: data } : data
            });

            log(`request-to-${target}`).error(errorResult);
            throw new Exception(`request to ${target} error${errorResult.httpInfo ? ' : ' + errorResult.httpInfo : ''}.`, errorResult.type, status);
        }

        throw new Exception(`request to ${target} error : no response.`);
    }

    async send(url, method, options = { params: {}, headers: {}, data: {} }, baseURL) {
        return await axios.request({
            url,
            method,
            baseURL,
            headers: options.headers,
            params: options.params,
            data: options.data
        });
    }

    async post(url, options = { params: {}, headers: {}, data: {} }, baseURL) {
        return this.send(url, 'post', { params: options.params, headers: options.headers, data: options.data }, baseURL);
    }

    async delete(url, options = { params: {}, headers: {}, data: {} }, baseURL) {
        return this.send(url, 'delete', { params: options.params, headers: options.headers, data: options.data }, baseURL);
    }

    async put(url, options = { params: {}, headers: {}, data: {} }, baseURL) {
        return this.send(url, 'put', { params: options.params, headers: options.headers, data: options.data }, baseURL);
    }

    async get(url, options = { params: {}, headers: {}, data: {} }, baseURL) {
        return this.send(url, 'get', { params: options.params, headers: options.headers, data: options.data }, baseURL);
    }
}

class VendorRequest extends Request {
    constructor() {
        super();
    }

    async sendBaidu(method, url, options = { query: {}, header: {}, body: {} }) {
        return await this.send(url, method, options, 'www.baidu.com');
    }
}

module.exports = new class HTTP extends VendorRequest {
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
