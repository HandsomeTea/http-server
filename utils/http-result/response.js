import { httpStatus } from './status';

/**
* 处理所有http请求,所有http请求的出口在 _resSend() 里
* Creates an instance of resReult.
* @param {*} _response
* @param {*} [_request=undefined]
*/
const resObj = class resReult {
    constructor(_response, _request = undefined) {
        if (!_response) {
            throw new Error('class resObj : parameter _response is required.');
        }
        this.response = _response;
        this.request = _request || null;
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
        this.response.status(404);
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
        this.response.send(_result);
    }
};

export const response = (_response, _request = undefined) => new resObj(_response, _request);
