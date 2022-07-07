import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, Method as AxiosMethod } from 'axios';
import httpContext from 'express-http-context';
import Agent from 'agentkeepalive';

import { traceId, log } from '@/configs';
import JWT from './JWT';

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
        axios.interceptors.request.use(this.beforeSendToServer, this.beforeSendToServerButError);

        // 响应拦截器
        axios.interceptors.response.use(this.receiveSuccessResponse, this.receiveResponseNotSuccess);
    }

    private beforeSendToServer(config: AxiosRequestConfig) {
        if (!config.headers) {
            config.headers = {};
        }

        if (!config.headers.Authorization) {
            config.headers.Authorization = JWT.sign();
        }

        if (!config.headers['x-b3-spanid']) {
            config.headers['x-b3-spanid'] = traceId();
        }

        if (!config.headers['x-b3-traceid']) {
            config.headers['x-b3-traceid'] = httpContext.get('traceId') || traceId();
        }

        if (!config.headers['x-b3-parentspanid']) {
            config.headers['x-b3-parentspanid'] = httpContext.get('spanId');
        }

        if (!config.headers['x-tenantId']) {
            config.headers['x-tenantId'] = httpContext.get('tenantId') || '';
        }

        const zh = config.url?.match(/[\u4e00-\u9fa5]/g);

        if (zh) {
            const _obj = {};

            for (let i = 0; i < zh.length; i++) {
                if (!_obj[zh[i]]) {
                    _obj[zh[i]] = encodeURIComponent(zh[i]);
                }
            }

            for (const key in _obj) {
                config.url = config.url?.replace(new RegExp(key, 'g'), _obj[key]);
            }
        }

        const { url, baseURL, method, params, data, headers } = config;
        const address = new URL(`${baseURL ? baseURL + url : url}`);

        log(`request-to:[(${method}) ${address.origin + address.pathname}]`).info(JSON.stringify({
            headers,
            query: Object.keys(params || {}).length > 0 ? params : (() => {
                const obj = {};

                [...address.searchParams.entries()].map(a => obj[a[0]] = a[1]);
                return obj;
            })(),
            body: data || {}
        }, null, '   '));

        return config;
    }

    private beforeSendToServerButError(error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        log('request-to-other-server').error(error);
        throw new Exception(error);
    }

    private async receiveSuccessResponse(response: AxiosResponse) {
        // 这里只处理 response.status >= 200 && response.status <= 207 的情况
        const { data, config: { method, baseURL, url }/*, headers, request, status, statusText*/ } = response;
        const address = new URL(`${baseURL ? baseURL + url : url}`);

        log(`response-from:[(${method}) ${address.origin + address.pathname}]`).info(JSON.stringify(data, null, '   '));
        return Promise.resolve(data);
    }

    private receiveResponseNotSuccess(error: AxiosError) {
        const { response, config, request } = error;

        let target = null;

        if (config) {
            const { url, baseURL, method } = config;

            target = `(${method}): ${baseURL ? baseURL + url : url}`;
        } else if (request) {
            target = request.responseURL;
        } else {
            log('response-from-other-server-error').error(error);
            throw new Exception(error);
        }
        const address = new URL(config ? `${config.baseURL ? config.baseURL + config.url : config.url}` : `${target}`);
        const _target = config ? `(${config.method}) ${address.origin + address.pathname}` : address.origin + address.pathname;

        if (response) {
            const { status, statusText, data } = response;

            log(`response-from:[${_target}]`).error({
                status,
                statusText,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                ...typeof data === 'string' ? { msg: data } : data
            });
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            throw new Exception(data);
        }

        log(`response-from:[${_target}]`).error(error);
        throw new Exception(`request to ${target} error : no response.`);
    }

    async send(url: string, method: AxiosMethod, baseURL?: string, options?: httpArgument) {
        return await axios.request(<AxiosRequestConfig>{
            url,
            method,
            baseURL,
            headers: options?.headers,
            params: options?.params,
            data: options?.data
        });
    }
}

class VendorRequest extends Request {
    constructor() {
        super();
    }

    async sendBaidu(method: AxiosMethod, url: string, options?: httpArgument) {
        return await this.send(url, method, 'www.baidu.com', options);
    }
}

export default new class HTTP extends VendorRequest {
    constructor() {
        super();
    }

    async search() {
        return await this.sendBaidu('post', '/search', { params: { s: 'test' } });
    }
};
