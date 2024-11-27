import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { ErrorCode, getENV } from '@/configs';

// interface JWTPayload {
// 	/** issuer,签发人 */
// 	iss: string
// 	/** expiration time,过期时间 */
// 	exp: string
// 	/** subject,主题 */
// 	sub: string
// 	/** audience,受众 */
// 	aud: string
// 	/** Not Before,生效时间，在这个时间前验证是失败的 */
// 	nbf: string
// 	/** Issued At,签发时间 */
// 	iat: string
// 	/** JWT ID,编号 */
// 	jti: string
// }

export default new class JWT {
	constructor() {
		this.init();
	}

	private init() {
		if (!this.secret) {
			throw new Exception('JWT secret is required!', ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	private get secret() {
		return getENV('JWT_SECRET');
	}

	sign(payload: Record<string, unknown>, option?: Pick<SignOptions, 'issuer' | 'subject' | 'audience' | 'jwtid' | 'expiresIn'>): string {
		return jwt.sign({
			...payload,
			iat: new Date().getTime()
		}, this.secret, {
			noTimestamp: true,
			header: {
				alg: 'HS256',
				typ: 'JWT'
			},
			...option
		});
	}

	verify<T, O = Pick<VerifyOptions, 'issuer' | 'subject' | 'audience' | 'jwtid'>>(jsonWebToken: string, option?: O) {
		try {
			const data = jwt.verify(jsonWebToken, this.secret, {
				...option,
				algorithms: ['HS256']
			}) as JwtPayload;
			const attribute = {
				...data.iss ? { issuer: data.iss } : {},
				...data.sub ? { subject: data.sub } : {},
				...data.aud ? { audience: data.aud } : {},
				...data.jti ? { jwtid: data.jti } : {}
			};

			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			delete data.iss, delete data.sub, delete data.aud, delete data.exp, delete data.nbf, delete data.iat, delete data.jti;

			return {
				...attribute,
				payload: data
			} as Required<O> & { payload: T };
		} catch (e) {
			throw new Exception(e as Error, ErrorCode.SERVER_REQUEST_UNAUTHORIZED);
		}
	}
};
