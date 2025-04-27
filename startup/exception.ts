import { getENV } from '@/configs';
import { HttpErrorType } from '@/configs/errorCode';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.Exception = class Exception extends Error {
	public message: string;
	public code!: string;
	public status!: number;
	public reason?: Record<string, unknown>;
	public source: Array<string> = [];

	constructor(error?: string | Partial<ExceptionInstance> | Error, code?: string, reason?: Record<string, unknown>) {
		super();

		// message
		if (typeof error === 'string') {
			this.message = error;
		} else if (error instanceof Error) {
			this.message = error.message;
		} else if (error instanceof Exception) {
			this.message = error.message;
			this.code = error.code;
			this.status = error.status;
			this.reason = error.reason;
			this.source = Array.from(error.source || '');
		} else {
			this.message = 'Internal Server Error';
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
			this.status = HttpErrorType[this.code as keyof typeof HttpErrorType] || 500;
		}

		// reason
		if (!this.reason) {
			this.reason = {};
		}
		if (reason && Object.keys(reason).length > 0) {
			this.reason = {
				...this.reason,
				...reason
			};
		}

		// source
		const serverName = getENV('SERVER_NAME');

		if (serverName && !this.source.includes(serverName)) {
			this.source.push(serverName);
		}
	}
};
