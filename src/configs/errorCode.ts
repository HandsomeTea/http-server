export const HttpErrorType = {
	URL_NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
	BAD_REQUEST: 400,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	INVALID_ARGUMENTS: 400,
	UNAUTHORIZED: 401,
	BE_LOGOUT: 401,
	REQUEST_TIMEOUT: 408,
	TOO_MANY_REQUESTS: 429,
	INVALID_EMAIL_SERVER_CONFIG: 500,
	INVALID_PHONE: 400,
	CODE_DATA_CHANGED: 403,
	CODE_ERROR_OR_EXPIRED: 401,
	USER_REQUEST_UNAUTHORIZED: 401,
	SERVER_REQUEST_UNAUTHORIZED: 403,
	INVALID_SERVER_AUTHORIZATION: 401,
	PHONE_MESSAGE_OUT_OF_LIMIT: 429,
	INVALID_SMS_SERVER_CONFIG: 500,
	GET_OAUTH_ACCESS_TOKEN_ERROR: 401,
	GET_OAUTH_IDENTITY_ERROR: 401,
	REQUEST_GITLAB_ERROR: 500,
	USER_NOT_FOUND: 404
} as const;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const ErrorCode: { [K in keyof typeof HttpErrorType]: K } = {} as const;

for (const key in HttpErrorType) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	ErrorCode[key] = key;
}

/**
 * @apiDefine ErrorApiResult
 * @apiErrorExample Error-Response:
 * {
 *   "status": 403,
 *   "type": "USER_NO_PERMISSION",
 *   "msg": "User Check Failure by userVerification",
 *   "reason": [],
 *   "source": []
 * }
 * @apiError {number} status 状态码
 * @apiError {string} type 错误类型
 * @apiError {string} msg 提示信息
 * @apiError {array} reason 错误信息中的变量(如有)信息
 * @apiError {array} source 错误源追踪信息
 */

/**
* @api {error} Error_code API ERROR CODE错误码
* @apiName Error_code
* @apiGroup ERROR CODE
* @apiVersion 1.0.0
* @apiParam (error) {string} URL_NOT_FOUND 路由未找到
* @apiParam (error) {string} SCOPE_NOT_FOUND scope未找到
* @apiParam (error) {string} OAUTH_LOGIN_TEMP_NOT_FOUND 从第三方获取oauth登录数据失败
* @apiParam (error) {string} SAML_LOGIN_TEMP_NOT_FOUND 从第三方获取saml登录数据失败
* @apiParam (error) {string} WECHAT_CACHE_USER_NOT_FOUND 从第三方获取微信用户数据失败
* @apiParam (error) {string} WECHAT_ACCOUNT_BINDING_LIMIT 同一个微信用户只能绑定一个超视云账号
* @apiParam (error) {string} TENANT_NOT_FOUND 租户未找到
* @apiParam (error) {string} USER_NOT_FOUND 用户未找到
* @apiParam (error) {string} LOGIN_ACCOUNT_NOT_FOUND 正在登录的账户未找到
* @apiParam (error) {string} BV_USER_NOT_FOUND BV用户未找到
* @apiParam (error) {string} USER_NOT_SET_PHONE 用户没有设置手机号
* @apiParam (error) {string} USER_NOT_SET_EMAIL 用户没有设置邮箱
* @apiParam (error) {string} USER_NOT_SET_PASSWORD 用户没有设置密码
* @apiParam (error) {string} INVALID_ARGUMENTS 参数不合法
* @apiParam (error) {string} INVALID_USER 用户数据不正常
* @apiParam (error) {string} INVALID_PASSWORD 密码格式不正确
* @apiParam (error) {string} INVALID_EMAIL 邮箱格式不正确
* @apiParam (error) {string} INVALID_PHONE 手机号格式不正确
* @apiParam (error) {string} INVALID_SMS_SERVER_CONFIG 短信服务配置不正确
* @apiParam (error) {string} INVALID_SDK SDK不可用(SDK鉴权失败)
* @apiParam (error) {string} INVALID_MEDIA_NUMBER 媒体账号不合法(修改zoom的pmi失败，pmi不符合zoom规则)
* @apiParam (error) {string} PASSWORD_ERROR 密码错误
* @apiParam (error) {string} LOGIN_PASSWORD_ERROR 正在登录的账户密码错误
* @apiParam (error) {string} VERIFICATION_CODE_ERROR 验证码错误
* @apiParam (error) {string} DIAL_NUMBER_ERROR 拨号错误
* @apiParam (error) {string} SCOPE_ERROR scope错误
* @apiParam (error) {string} SCOPE_TYPE_ERROR scope的type错误
* @apiParam (error) {string} JWT_TOKEN_ERROR 服务器通讯令牌错误
* @apiParam (error) {string} GET_OAUTH_ACCESS_TOKEN_ERROR oauth的token获取出错
* @apiParam (error) {string} GET_OAUTH_IDENTITY_ERROR oauth用户数据获取出错
* @apiParam (error) {string} BINDING_CODE_ERROR 绑定码错误
* @apiParam (error) {string} LOGIN_TOKEN_ERROR 登录令牌错误
* @apiParam (error) {string} USER_NEED_LOGIN 用户需要登录
* @apiParam (error) {string} USER_NO_PERMISSION 用户没有权限
* @apiParam (error) {string} PHONE_NEED_VERIFY 手机号必须验证
* @apiParam (error) {string} USER_NOT_ACTIVE 用户处于未激活状态
* @apiParam (error) {string} SDK_NOT_ACTIVE SDK处于未激活状态
* @apiParam (error) {string} USER_ALREADY_EXIST 用户已存在
* @apiParam (error) {string} USER_ALREADY_REGISTERED 用户已注册(等待审批)
* @apiParam (error) {string} ALREADY_BINDING_WECHAT 用户已经绑定微信登录
* @apiParam (error) {string} BE_LOGOUT 用户已被登出
* @apiParam (error) {string} PASSWORD_LOGIN_LOCKED 密码登录已被锁定
* @apiParam (error) {string} PASSWORD_EXPIRED 密码已过期
* @apiParam (error) {string} LOGIN_EXPIRED 登录已过期
* @apiParam (error) {string} NOT_ALLOWED 操作不允许
* @apiParam (error) {string} SMS_SEND_OVER_LIMIT 短信发送频率超限
* @apiParam (error) {string} SERVICE_TEMPORARY_UNAVAILABLE 服务暂时不可达(no response/timeout)
* @apiParam (error) {string} MEDIA_NUMBER_ALREADY_USED 媒体号码已被使用(在zoom中存在相同的pmi)
*/
