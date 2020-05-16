const _ = require('underscore');

const { errorCodeMap } = require('../src/configs');

global.Exception = class Exception extends Error {
    constructor(messageOrError, type, status) {
        super(messageOrError);

        if (_.isError(messageOrError)) {
            if (messageOrError.message) {
                this.msg = messageOrError.message;
            }

            if (messageOrError.status) {
                this.status = messageOrError.status;
            }

            if (messageOrError.type) {
                this.status = messageOrError.type;
            }
        }

        if (status && !this.status) {
            this.status = parseInt(status);
        }

        if (type && !this.type) {
            this.type = type;
        }

        if (messageOrError && _.isString(messageOrError) && !this.msg) {
            this.msg = messageOrError;
        }
        this._init();
    }

    _init() {
        if (!this.type) {
            this.type = 'INTERNAL_SERVER_ERROR';
        }

        if (!this.status) {
            for (const code in errorCodeMap) {
                if (errorCodeMap[code].includes(this.type)) {
                    this.status = parseInt(code);
                    break;
                }
            }
        }

        if (!this.msg) {
            this.msg = 'server inner error!';
        }
    }
};
