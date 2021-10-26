import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, Method as AxiosMethod } from 'axios';
import { Method as GotMethod } from 'got';
import httpContext from 'express-http-context';
import Agent from 'agentkeepalive';

import { traceId, log } from '@/configs';
import JWT from './jwtService';

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

        log('send-to-other-server').debug({
            target: `(${method}): ${baseURL ? baseURL + url : url}`,
            headers,
            params: params || {},
            data: data || {}
        });

        return config;
    }

    private beforeSendToServerButError(error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        log('request-server').error(error);
        throw new Exception(error);
    }

    private async receiveSuccessResponse(response: AxiosResponse) {
        // 这里只处理 response.status >= 200 && response.status <= 207 的情况
        const { data/*, config, headers, request, status, statusText*/ } = response;

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
            log('send-to-other-server-error').error(error);
            throw new Exception(error);
        }

        if (response) {
            const { status, statusText, data } = response;

            log(`request-to-${target}`).error({
                status,
                statusText,
                ...typeof data === 'string' ? { msg: data } : data
            });
            throw new Exception(data);
        }

        log(`request-to-${target}`).error(error);
        throw new Exception(`request to ${target} error : no response.`);
    }

    // private async sendAsHttps(url: string, method: GotMethod, baseURL?: string, options?: httpArgument) {
    //     try {
    //         const response = await got(baseURL ? `${baseURL}${url}` : url, {
    //             method,
    //             responseType: 'json',
    //             https: {
    //                 rejectUnauthorized: false
    //             },
    //             headers: {
    //                 ...options?.headers
    //             },
    //             ...method.toLocaleLowerCase() === 'get' ? {} : {
    //                 json: {
    //                     ...options?.data
    //                 }
    //             },
    //             searchParams: {
    //                 ...options?.params
    //             },
    //             hooks: {
    //                 beforeRequest: [
    //                     option => {
    //                         if (!option.headers.Authorization) {
    //                             option.headers.Authorization = JWT.sign();
    //                         }

    //                         if (!option.headers['x-b3-spanid']) {
    //                             option.headers['x-b3-spanid'] = traceId();
    //                         }

    //                         if (!option.headers['x-b3-traceid']) {
    //                             option.headers['x-b3-traceid'] = httpContext.get('traceId') || traceId();
    //                         }

    //                         if (!option.headers['x-b3-parentspanid']) {
    //                             option.headers['x-b3-parentspanid'] = httpContext.get('spanId');
    //                         }

    //                         if (!option.headers['x-tenantId'] && !option.headers['x-tenantid']) {
    //                             option.headers['x-tenantId'] = httpContext.get('tenantId') || '';
    //                         }

    //                     }
    //                 ]
    //             }
    //         });
    //         const data = <any>(response.body); // eslint-disable-line @typescript-eslint/no-explicit-any

    //         log(`request-to-${baseURL ? baseURL : url}`).debug(data);

    //         return Promise.resolve(data);
    //     } catch (e) {
    //         const error = e as ParseError;

    //         if (error.response) {
    //             const { /*statusCode, */body } = error.response;

    //             log(`request-to-${baseURL ? baseURL : url}`).error(body);
    //             throw new Exception(JSON.stringify(body));
    //         }

    //         log(`request-to-${baseURL ? baseURL : url}`).error(error);
    //         throw new Exception(`request to (${method}): ${baseURL ? baseURL + url : url} error : no response.`);
    //     }
    // }

    async send(url: string, method: GotMethod | AxiosMethod, baseURL?: string, options?: httpArgument) {
        // const isHttps = (baseURL || url).includes('https');

        // if (isHttps) {
        //     if (method !== 'purge' && method !== 'PURGE' && method !== 'link' && method !== 'LINK' && method !== 'unlink' && method !== 'UNLINK') {
        //         return await this.sendAsHttps(url, method, baseURL, { params: options?.params || {}, data: options?.data || {}, headers: options?.headers || {} });
        //     }
        // } else {
        // if (method !== 'TRACE' && method !== 'trace') {
        return await axios.request(<AxiosRequestConfig>{
            url,
            method,
            baseURL,
            headers: options?.headers,
            params: options?.params,
            data: options?.data
        });
        // }
        // }
    }
}

class VendorRequest extends Request {
    constructor() {
        super();
    }

    async sendBaidu(method: GotMethod | AxiosMethod, url: string, options?: httpArgument) {
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
