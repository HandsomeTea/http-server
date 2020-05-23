const router = require('express').Router();
const asyncHandler = require('express-async-handler');
// const { errorType, log } = require('../../../src/configs');
// const { Users } = require('../../models');

/**
 * @api {post} /tests/test/api 测试接口
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
    // log('HTTP_REQUEST').error('test error log.');
    // return res.failure({ result: '测试成功' });
    // return res.notFound({ result: '测试成功' });
    // return res.serverError({ result: '测试成功' });
    // return res.noPermission({ result: '测试成功' });
    return res.tooMany({ result: '测试成功' });
    // return res.success(new Date((await Users.find({}))[0].createdAt).getTime());
    // throw new Exception('cuo wu', errorType.FORBIDDEN);
}));

module.exports = router;
