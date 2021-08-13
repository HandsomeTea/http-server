import { errorCodeMap } from '@/configs';

global.Exception = class Exception extends Error {
    public message: string;
    public source: Array<string> = [];
    public code!: string;
    public status!: number;
    public reason?: Array<string>;

    constructor(messageOrErrorOrException: string | InstanceException | Error, code?: string, reason?: Array<string>) {
        super();
        // message
        if (typeof messageOrErrorOrException === 'string') {
            this.message = messageOrErrorOrException;
        } else {
            this.message = messageOrErrorOrException.message;
            if (messageOrErrorOrException.constructor === Exception) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                this.source = Array.from(messageOrErrorOrException.source);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                this.code = messageOrErrorOrException.code;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                this.status = messageOrErrorOrException.status;
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                this.reason = messageOrErrorOrException.reason;
            }
        }

        // source
        const serverName = process.env.SERVER_NAME;

        if (serverName && !this.source.includes(serverName)) {
            this.source.push(serverName);
        }

        // code
        if (code && !this.code) {
            this.code = code;
        }

        if (!this.code) {
            this.code = 'INTERNAL_SERVER_ERROR';
        }

        // status
        if (!this.status) {
            for (const code in errorCodeMap) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (errorCodeMap[code].includes(this.code)) {
                    this.status = parseInt(code);
                    break;
                }
            }
        }

        // reason
        if (reason && reason.length > 0) {
            if (!this.reason) {
                this.reason = [];
            }
            this.reason.push(...reason);
        }
    }
};
