import { httpStatus } from './status';
import { trace } from '../log';

/**
* 处理所有http请求,所有http请求的出口在 _resSend() 里
* Creates an instance of resReult.
* @param {*} _response
*/
export default (_response) => new class resReult {
    constructor() {
        if (!_response) {
            throw new Error('class resObj : parameter _response is required.');
        }
        this.response = _response;
        this.request = _response.req;
    }

    success(_data, _type) {
        this.response.status(200);
        this._resSend({
            result: true,
            type: _type || httpStatus.success,
            data: _data
        });
    }

    failure(_data, _type) {
        this.response.status(400);
        this._resSend({
            result: false,
            type: _type || httpStatus.failed,
            info: _data
        });
    }

    notFound(_data, _type) {
        this.response.status(404);
        this._resSend({
            result: false,
            type: _type || httpStatus.notFound,
            info: _data
        });
    }

    internalError(_data, _type) {
        this.response.status(500);
        this._resSend({
            result: false,
            type: _type || httpStatus.innerError,
            info: _data
        });
    }

    unauthorized(_data, _type) {
        this.response.status(403);
        this._resSend({
            result: false,
            type: _type || httpStatus.noPermission,
            info: _data
        });
    }

    tooManyRequests(_data, _type) {
        this.response.status(429);
        this._resSend({
            result: false,
            type: _type || httpStatus.tooMany,
            info: _data
        });
    }

    _resSend(_result) {
        const addressIpv4 = (this.request.headers['x-forwarded-for'] || this.request.connection.remoteAddress || this.request.socket.remoteAddress || this.request.connection.socket.remoteAddress).match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

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
        trace('req-res', { traceId: this.request.headers['x-b3-traceid'], spanId: this.request.headers['x-b3-spanid'], parentSpanId: this.request.headers['x-b3-parentspanid'] }).info(`[${addressIpv4}(${this.request.method}): ${this.request.protocol}://${this.request.get('host')}${this.request.originalUrl}] request parameter :${_datas || ' no parameter'} , response result : ${JSON.stringify(_result)}`);
        this.response.send(_result);
    }
};
