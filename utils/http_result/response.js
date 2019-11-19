const httpStatus = require('./status');
const { trace } = require('../log');
const { traceType } = require('../../conf');

/**
* 处理所有http请求,所有http请求的出口在 _resSend() 里
* Creates an instance of resReult.
* @param {*} _response
*/
module.exports = _response => new class resReult {
    constructor() {
        if (!_response) {
            throw new Error('class resReult : parameter _response is required.');
        }
        this.response = _response;
        this.request = _response.req;
        this._init();
    }
    /**
     * 初始化
     */
    _init() {

    }
    /**
     * 所有http请求的回返结构定义
     * @param {*} _data
     * @param {*} _httpStatusCode
     * @param {*} _httpStatusType
     */
    _resultDefine(_data, _httpStatusCode, _httpStatusType) {
        this.response.status(_httpStatusCode);
        const _format = {
            result: _httpStatusCode === 200,
            type: _httpStatusType
        };

        if (_httpStatusCode === 200) {
            _format.data = _data;
        } else {
            _format.info = _data;
        }
        this._resSend(_format);
    }

    /**
     * request处理成功的封装
     * @param {*} _data
     * @param {*} _type
     */
    success(_data, _type) {
        this._resultDefine(_data, 200, _type || httpStatus.success);
    }

    /**
     * request处理失败的封装
     * @param {*} _data
     * @param {*} _type
     */
    failure(_data, _type) {
        this._resultDefine(_data, 400, _type || httpStatus.failed);
    }

    /**
     * request处理对象未找到的封装
     * @param {*} _data
     * @param {*} _type
     */
    notFound(_data, _type) {
        this._resultDefine(_data, 404, _type || httpStatus.notFound);
    }

    /**
     * request处理未授权的封装
     * @param {*} _data
     * @param {*} _type
     */
    unauthorized(_data, _type) {
        this._resultDefine(_data, 403, _type || httpStatus.noPermission);
    }

    /**
     * request太多太频繁的封装
     * @param {*} _data
     * @param {*} _type
     */
    tooManyRequests(_data, _type) {
        this._resultDefine(_data, 429, _type || httpStatus.tooMany);
    }

    /**
     * 服务器处理request出错的封装
     * @param {*} _data
     * @param {*} _type
     */
    internalError(_data, _type) {
        this._resultDefine(_data, 500, _type || httpStatus.innerError);
    }

    /**
     * http请求统一回返
     * @param {*} _result
     */
    _resSend(_result) {
        let addressIpv4 = (this.request.headers['x-forwarded-for'] || this.request.connection.remoteAddress || this.request.socket.remoteAddress || this.request.connection.socket.remoteAddress).match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

        if (!addressIpv4) {
            addressIpv4 = '0.0.0.0';
            this.request.log('system-error').warn('The server does not specify a listening address, set default request address to 0.0.0.0 ');
        }
        let _datas = '';

        if (Object.getOwnPropertyNames(this.request.body).length > 0) {
            _datas += ` body=>${JSON.stringify(this.request.body)}`;
        }
        if (Object.getOwnPropertyNames(this.request.query).length > 0) {
            _datas += ` query=>${JSON.stringify(this.request.query)}`;
        }
        if (Object.getOwnPropertyNames(this.request.params).length > 0) {
            _datas += ` params=>${JSON.stringify(this.request.params)}`;
        }
        trace(traceType.default, { traceId: this.request.headers['x-b3-traceid'], spanId: this.request.headers['x-b3-spanid'], parentSpanId: this.request.headers['x-b3-parentspanid'] }).info(`[${addressIpv4}(${this.request.method}): ${this.request.protocol}://${this.request.get('host')}${this.request.originalUrl}] request parameter :${_datas || ' no parameter'} , response result : ${JSON.stringify(_result)}`);
        this.response.send(_result);
    }
};
