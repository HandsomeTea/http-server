const router = require('express').Router();
const asyncHandler = require('express-async-handler');
// const HttpError = require('../../../config/http.error.type');
// const redis = require('../../service/redis/redis');
const { Users } = require('../../models');
// const { logModule } = require('../../../config/log.type');

/**
 * @api {post} /tests/test/:data 测试接口
 * @apiName 测试接口
 * @apiGroup TEST
 * @apiVersion 1.0.0
 * @apiParam (Body) {String[]} userid userid列表.
 * @apiParam (Body) {Number[]} [externalUserId] externalUserId列表.
 * @apiParamExample {json} Request-Example:
 * {
 *	"userid": [
 *		"KQtgCNnERJhhPpJ6m",
 *		"nBdgdPWQ3xXNk7yez",
 *		"3J6udQPg8RhtsLQnM"
 *	],
 *  "externalUserId": [
 *       "gsEt2RhdMbjRzvAkt",
 *       90217
 *   ],
 * }
 * @apiSuccess {Number} status 状态码.
 * @apiSuccess {Object[]} data user列表.
 * @apiSuccess {String} _id userId.
 * @apiSuccess {String} avatarUrl 头像.
 * @apiSuccess {String} username 账号.
 * @apiSuccess {String} name 昵称.
 * @apiSuccess {String} externalUserId externalUserId.
 * @apiSuccessExample Success-Response:
 * {
 *   "result": true,
 *   "type": "SEARCH_SUCCESS",
 *   "data": {
 *       "user": ""
 *   }
 * }
 * @apiErrorExample Error-Response:
 * {
 *   "result": false,
 *   "type": "USER_NO_PERMISSION",
 *   "info": "error."
 * }
 * @apiError {Boolean} result 请求成功与否
 * @apiError {String} type 失败类型
 * @apiError {String} info 错误信息
 */

router.get('/api', asyncHandler(async (req, res) => {
    // log(logModule.api).error('test error log.');
    // res.failure({ result: '测试成功' });
    // res.notFound({ result: '测试成功' }, HttpError.notFoundUser);
    // res.serverError({ result: '测试成功' }, HttpError.innerDBError);
    // res.noPermission({ result: '测试成功' }, HttpError.noPermissionUser);
    // res.tooManyRequests({ result: '测试成功' }, HttpError.tooMany);
    res.success(new Date((await Users.find({}))[0].createdAt).getTime());
    // throw new Exception('cuo wu');
}));

module.exports = router;
