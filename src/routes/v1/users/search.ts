import express from 'express';
import asyncHandler from 'express-async-handler';
import { _Users } from '../../../models';

const router = express.Router();

/**
 * @api {post} /api/v1/users/search 查询用户列表
 * @apiName 测试接口
 * @apiGroup TEST
 * @apiVersion 1.0.0
 * @apiParam (Body) {String[]} userid userid列表.
 * @apiParam (Body) {Number[]} [externalUserId] externalUserId列表.
 * @apiSuccess {Number} status 状态码.
 * @apiSuccess {Object[]} data user列表.
 * @apiSuccess {String} _id userId.
 * @apiSuccess {String} avatarUrl 头像.
 * @apiSuccess {String} username 账号.
 * @apiSuccess {String} name 昵称.
 * @apiSuccess {String} externalUserId externalUserId.
 * @apiUse ErrorApiResult
 */
router.get('/search', asyncHandler(async (_req, res) => {
    // log('HTTP_REQUEST').error('test error log.');
    const User = new _Users('t1');

    await User.create({
        _id: '',
        name: 'test1'
    });
    return res.success();
    // throw new Exception(new Error('cuo wu'));
    // throw new Exception(new Exception('cuo wu'));
}));

router.get('/:userId', asyncHandler(async (req, res) => {
    const User = new _Users('t1');

    return res.success(await User.findById(req.params.userId, { projection: ['name'] }));
}));

export default router;
