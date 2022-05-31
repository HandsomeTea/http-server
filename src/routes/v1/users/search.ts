import express from 'express';
import asyncHandler from 'express-async-handler';
import { _UserTokens } from '@/dal';
// import User from '../../../models/_mysql';

const router = express.Router();

/**
 * @api {post} /api/v1/user/user 查询用户列表
 * @apiName 测试接口
 * @apiGroup TEST
 * @apiVersion 1.0.0
 * @apiParam (body) {String[]} userid userid列表.
 * @apiParam (body) {Number[]} [externalUserId] externalUserId列表.
 * @apiSuccess {Number} status 状态码.
 * @apiSuccess {Object[]} data user列表.
 * @apiSuccess {String} _id userId.
 * @apiSuccess {String} avatarUrl 头像.
 * @apiSuccess {String} username 账号.
 * @apiSuccess {String} name 昵称.
 * @apiSuccess {String} externalUserId externalUserId.
 * @apiUse ErrorApiResult
 */
router.post('/user', asyncHandler(async (_req, res) => {
    const UserTokens = new _UserTokens('11686');

    // await User.find();
    return res.success({
        result: await UserTokens.insertLoginToken({
            type: 'ws',
            userId: 'asdasdasds',
            hashedToken: 'sad23asd345dfgss123'
            // deviceType: 'BCD',
            // serialNumber: 'ASDDFGFG45645'
        })
    });
    // console.log(await User.update<UserModel>({ where: { _id: 132 } }, { account: 'newaccount' }));
    // return res.success(await UserTokens.findOne({
    //     hashedToken: 'sad23asd345dfgs',
    //     userId: 'asdasdasd'
    // }));
    // throw new Exception(new Error('cuo wu'));
    // throw new Exception(new Exception('cuo wu'));
}));

// router.get('/:userId', asyncHandler(async (req, res) => {
//     const Users = new _Users('11685');

//     // 6215a94749e853ee5e2df2b9 test123sss
//     // return res.success(await Users.findById(req.params.userId, { projection: { name: 1 } }));
//     return res.success(await Users.findById(req.params.userId));
// }));

export default router;
