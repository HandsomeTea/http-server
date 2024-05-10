import { ErrorCode } from '@/configs';
// import { check } from '@/utils';
// import { isPhone } from '@coco-sheng/js-tools';
import express from 'express';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.route('/administrator')
	/**
	 * @api {post} /api/v1/user/administrator 新建管理员用户
	 * @apiGroup 管理员账户
	 * @apiVersion 1.0.0
	 * @apiParam (body) {string} name 姓名
	 * @apiParam (body) {string} account 账户，登录使用
	 * @apiParam (body) {string} password 密码
	 * @apiParam (body) {string} [phone] 手机号
	 */
	.post(asyncHandler(async (_req, _res) => {
		// check(req.body, {
		// 	name: { type: String, notEmpty: true, required: true },
		// 	account: { type: String, notEmpty: true, required: true },
		// 	password: { type: String, notEmpty: true, required: true },
		// 	phone: { type: String }
		// });
		// const { name, account, password, phone } = req.body as AdminUserModel;

		// if (phone && !isPhone(phone)) {
		// 	throw new Exception('invalid phone.', ErrorCode.INVALID_PHONE);
		// }
		// const admin1 = await AdminUsers.find({ account });
		// const admin2 = !phone ? [] : await AdminUsers.find({ phone });

		// if (admin1.length > 0 || admin2.length > 0) {
		// 	throw new Exception('admin user has already exist.', ErrorCode.USER_ALREADY_EXIST);
		// }
		// const count = await AdminUsers.count();

		// if (count >= 100) {
		// 	throw new Exception('the number of admin users exceeds 100.', ErrorCode.NOT_ALLOWED);
		// }
		// await AdminUsers.save({ name, account, password, phone });

		// res.sendData((await AdminUsers.find({ account }, undefined, ['name', 'account', 'phone']))[0]);
	}))
	/**
	 * @api {get} /api/v1/user/administrator 管理员用户分页查询
	 * @apiGroup 管理员账户
	 * @apiVersion 1.0.0
	 * @apiParam (query) {string} [name] 姓名
	 * @apiParam (query) {string} [phone] 手机号
	 * @apiParam (query) {number} [skip] 跳过数
	 * @apiParam (query) {number} [limit] 获取数
	 */
	.get(asyncHandler(async (_req, _res) => {
		// res.sendData({
		// 	list: await AdminUsers.find(req.query, req.query, ['account', 'name', 'phone']),
		// 	total: await AdminUsers.count(req.query)
		// });
	}));


router.route('/administrator/:account').all((req, _res, next) => {
	if (!req.params.account) {
		throw new Exception('administrator account is required.', ErrorCode.INVALID_ARGUMENTS);
	}

	next();
})
	/**
	 * @api {delete} /api/v1/user/administrator/:account 管理员删除
	 * @apiGroup 管理员账户
	 * @apiVersion 1.0.0
	 * @apiParam (params) {String} account 管理员账户
	 */
	.delete(asyncHandler(async (_req, _res) => {
		// const adminCount = await AdminUsers.count();

		// if (adminCount === 1) {
		// 	throw new Exception('there must be one admin user at least.', ErrorCode.NOT_ALLOWED);
		// }
		// res.sendData(await AdminUsers.delete({ account: req.params.account }));
	}))
	/**
	 * @api {put} /api/v1/user/administrator/:account 管理员修改
	 * @apiGroup 管理员账户
	 * @apiVersion 1.0.0
	 * @apiParam (params) {String} account 管理员账户
	 * @apiParam (body) {string} [name] 姓名
	 * @apiParam (body) {string} [password] 密码
	 * @apiParam (body) {string} [phone] 手机号
	 */
	.put(asyncHandler(async (_req, _res) => {
		// const { name, password, phone } = req.body as AdminUserModel;

		// if (phone && !isPhone(phone)) {
		// 	throw new Exception('invalid phone.', ErrorCode.INVALID_PHONE);
		// }

		// res.sendData(await AdminUsers.update(req.params.account, { name, password, phone }));
	}))
	/**
	 * @api {get} /api/v1/user/administrator/:account 管理员详情查询
	 * @apiGroup 管理员账户
	 * @apiVersion 1.0.0
	 * @apiParam (params) {String} account 管理员账户
	 */
	.get(asyncHandler(async (_req, _res) => {
		// res.sendData((await AdminUsers.find({ account: req.params.account }))[0]);
	}));

export default router;
