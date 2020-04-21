const axios = require('axios');
const httpContext = require('express-http-context');

const { errorType, traceId, log } = require('../configs');
const { JWT } = require('../service');
const { type } = require('../utils');

module.exports = new class RequestServer {
    constructor() {
        this._init();
    }

    _init() {
        axios.defaults.timeout = 10000;
        // axios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

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
        return config;
    }

    async _beforeSendToServerButError(error) {
        log('request-server').error(error);
        throw new Exception('request server send to other service error', errorType.INTERNAL_SERVER_ERROR);
    }

    async _receiveSuccessResponse(response) {
        // 这里只处理 response.status >= 200 && response.status <= 207 的情况
        return Promise.resolve(response.data);
    }

    async _receiveResponseNotSuccess(error) {
        const { response, config/*, request */ } = error;
        const { url, baseURL, method } = config;
        const { status, statusText, data } = response;
        // const { message, name, description, number, fileName, lineNumber, columnNumber, stack, code } = error.toJSON();
        const errorResult = {
            sendRequest: `(${method}): ${baseURL ? baseURL + url : url}`,
            status,
            httpInfo: statusText,
            ...type(data) === 'string' ? { info: data } : data
        };

        log('request-server').error(errorResult);
        throw new Exception(JSON.stringify(errorResult), errorType.INTERNAL_SERVER_ERROR);
    }

    async send(url, method, options = { query: {}, header: {}, body: {} }, baseURL) {
        return await axios.request({
            url,
            method,
            baseURL,
            headers: options.header,
            params: options.query,
            data: options.body
        });
    }

    async post(url, options = { query: {}, header: {}, body: {} }, baseURL) {
        return this.send(url, 'post', { query: options.query, header: options.header, body: options.body }, baseURL);
    }

    async delete(url, options = { query: {}, header: {}, body: {} }, baseURL) {
        return this.send(url, 'delete', { query: options.query, header: options.header, body: options.body }, baseURL);
    }

    async put(url, options = { query: {}, header: {}, body: {} }, baseURL) {
        return this.send(url, 'put', { query: options.query, header: options.header, body: options.body }, baseURL);
    }

    async get(url, options = { query: {}, header: {} }, baseURL) {
        return this.send(url, 'get', { query: options.query, header: options.header }, baseURL);
    }
};
