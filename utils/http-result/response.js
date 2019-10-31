import httpStatus from './type';

export const resObj = class resReult {
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
            type: httpStatus._200,
            data: _data
        });
    }

    notFound(_data, _type) {
        this.response.status(404);
        this._resSend({
            result: false,
            type: _type || 'NOT_FOUND',
            info: _data
        });
    }

    _resSend(_result) {
        this.response.send(_result);
    }
};

export const response = (_response, _request = undefined) => new resObj(_response, _request);
