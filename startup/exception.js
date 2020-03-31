const { errorType, errorCodeMap } = require('../src/configs');

global.Exception = class Exception extends Error {
    constructor(message, type) {
        super(message);
        this._init(type);
    }

    _init(type) {
        this.type = type || errorType.INTERNAL_SERVER_ERROR;
        for (const code in errorCodeMap) {
            if (errorCodeMap[code].includes(type)) {
                this.status = parseInt(code);
                break;
            }
        }
    }
};
