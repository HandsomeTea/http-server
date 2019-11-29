const { Router } = require('express');
const asyncHandler = require('express-async-handler');

const { httpStatus } = require('../../utils');
// const redis = require('../../service/redis/redis');
const { users } = require('../../service/mongodb');

const router = Router();

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
router.get('/:data', asyncHandler(async (req, res) => {
    // req.trace().info('123123123');
    // let 你说 = 'you say';
    // await delay(3000);
    // req.audit().warn('22sssss');
    // res.noPermission({ result: '测试成功' }, httpStatus.noPermissionUser);
    // res.success({ test: await redis.testSet() }, httpStatus.successSearch);
    // res.success({ test: await redis.testGet() }, httpStatus.successSearch);
    console.log(123);
    res.success({ test: await users.findAll() }, httpStatus.successSearch);
    // throw new Error('cuo wu');
}));

router.post('/:id', (req, res) => {
    // req.trace().info('123123123');
    // req.log().info('123sdfsdf', '123123ssssssssssssssssssss');
    // req.audit().warn('22sssss');
    // res.success({ result: '测试成功' }, httpStatus.successSearch);
    // res.failure({ result: '测试成功' }, httpStatus.failedUpdate);
    // res.notFound({ result: '测试成功' }, httpStatus.notFoundUser);
    // res.serverError({ result: '测试成功' }, httpStatus.innerDBError);
    // res.noPermission({ result: '测试成功' }, httpStatus.noPermissionUser);
    res.tooManyRequests({ result: '测试成功' }, httpStatus.tooMany);
});
module.exports = router;
