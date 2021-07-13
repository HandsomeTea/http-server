export const errorType = {
    URL_NOT_FOUND: 'URL_NOT_FOUND',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    INVALID_ARGUMENTS: 'INVALID_ARGUMENTS',
    BE_LOGOUT: 'BE_LOGOUT',
    INVALID_EMAIL_SERVER_CONFIG: 'INVALID_EMAIL_SERVER_CONFIG',
    INVALID_SMS_SERVER_CONFIG: 'INVALID_SMS_SERVER_CONFIG'
};

export const errorCodeMap = {
    '400': ['INVALID_', 'BAD_REQUEST', 'INVALID_ARGUMENTS'],
    '401': ['UNAUTHORIZED', 'BE_LOGOUT'],
    '403': ['FORBIDDEN'],
    '404': ['NOT_FOUND', 'URL_NOT_FOUND'],
    '408': ['REQUEST_TIMEOUT'],
    '429': ['TOO_MANY_REQUESTS'],
    '500': ['INTERNAL_SERVER_ERROR', 'INVALID_EMAIL_SERVER_CONFIG', 'INVALID_SMS_SERVER_CONFIG']
};

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
