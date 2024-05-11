declare interface httpArgument {
	params?: Record<string, any>;
	data?: Record<string, unknown>;
	headers?: Record<string, string | string[] | undefined>
}

declare interface ExceptionInstance {
	message: string;
	source: Array<string>;
	code: string;
	status: number;
	reason?: Array<string>;
}

declare interface ExceptionConstructor {
	new(messageOrErrorOrException: string | ExceptionInstance | Error, code?: string, reason?: Array<string>): ExceptionInstance;
	readonly prototype: ExceptionInstance;
}

declare const Exception: ExceptionConstructor;

type DBServerType = 'mongodb' | 'mysql' | 'dameng' | 'postgres';

declare namespace Express {
	interface Response {
		success: (result?: unknown) => void
	}

	interface Request {

	}
}

type KeysOf<T> = { [P in keyof T]?: T[P] | any };
type PartialOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
