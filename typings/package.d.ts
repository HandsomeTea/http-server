/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'ali-sms' {
	import aliSms from 'ali-sms';

	interface aliSMSConfig {
		accessKeyID: string
		accessKeySecret: string
		paramString: Record<string, any>
		recNum: Array<string>
		signName: string
		templateCode: string
	}

	export default (config: aliSMSConfig, callback: (error?: any, body?: any) => void) => aliSms(config, callback);
}

declare module 'dm-type' {
	// export type DMFnType = 'lower'

	export interface SQLOption<M, P extends keyof M> {
		$ne?: M[P]
		$in?: Array<M[P]>
		$notIn?: Array<M[P]>
		$like?: string
		$regexp?: string | RegExp
		$between?: [M[P], M[P]]
		$gt?: M[P]
		$lt?: M[P]
		$gte?: M[P]
		$lte?: M[P]
		// useFn?: { value: M[P], fn: DMFnType, useForCol?: boolean | DMFnType }
		useFn?: { value: M[P], fn: string, useForCol?: boolean | string }
	}

	export type WhereOption<M> = {
		[P in keyof M]?: M[P] | SQLOption<M, P>
	}

	export interface QueryOption<M> {
		where?: WhereOption<M> & { $or?: Array<WhereOption<M>> }
		order?: Array<{ [P in keyof M]?: 'asc' | 'desc' }>
		limit?: number
		offset?: number
	}

	// export type UpsertOption<M> = { [P in keyof M]?: M[P] }
	export type UpdateOption<M> = {
		[P in keyof M]?: M[P] extends string ? (string | { $pull: M[P], $split: ',' }) : M[P]
	}

	// export interface DmModelOption {
	//     type: 'DATE' | 'NUMBER' | 'STRING'
	// }

	export type DmModel<M, M extends object> = {
		[K in keyof M]: {
			type: 'DATE' | 'NUMBER' | 'STRING'
			set?: (any) => M[K],
			defaultValue?: M[K] | (() => M[K])
		}
	}

}

declare module 'pinyin' {
	import pinyin from '@types/pinyin';

	export default pinyin;
}
