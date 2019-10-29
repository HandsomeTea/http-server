import _ from 'underscore';

export const resObj = class resReult {
    constructor(_response, _request = undefined) {
        if (!_response) {
            throw new Error('class resObj : parameter _response is required.');
        }
        this.response = _response;
        this.request = _request || null;
    }

    success(_data) {
        if (_.isObject(_data)) {
            _data.type = 'SUCCESS';
            if (_data.result) {
                delete _data.result;
            }
        } else {
            _data = {
                type: 'SUCCESS',
                data: _data
            };
        }

        this.response.status(200);
        this._resSend(_.extend({ result: true }, _data));
    }

    notFound(_data, _type) {
        if (_.isObject(_data)) {
            _data.type = _type || 'NOT_FOUND';
            if (_data.result) {
                delete _data.result;
            }
        } else {
            _data = {
                type: _type || 'NOT_FOUND',
                data: _data
            };
        }

        this.response.status(404);
        this._resSend(_.extend({ result: false }, _data));
    }

    _resSend(_result) {
        this.response.send(_result);
    }
};

export const response = (_response, _request = undefined) => new resObj(_response, _request);
