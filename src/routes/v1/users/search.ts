import { trace } from '@/configs';
import express from 'express';
import asyncHandler from 'express-async-handler';
import httpContext from 'express-http-context';
// import { _UserTokens } from '@/dal';
// import User from '../../../models/_mysql';
// import { Test } from '@/models/es';
// import { Gerrit, Gitlab } from '@/services';


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
	// const UserTokens = new _UserTokens('11685');

	// await Test.insertOne({
	//     a: +new Date,
	//     b: true,
	//     c: 'sadas asda',
	//     d: {
	//         test: 1
	//     }
	// });
	// res.success({
	//     result: await Test.removeMany({
	//         match: {
	//             c: 'sadas asda'
	//         }
	//     })
	// });
	// res.success({
	//     result: await Test.findById('jIsh8IcBIrfCM5mjicNO')
	// });
	res.success({ result: 'asdasd-post' });
	// const tag = await Gerrit.getTag('st_mobile_android', 'effects_v4.5.1');
	// res.success(await Gerrit.getCommitBranchsAndTags('sdk_face', '379659e456851911d97ea3d82844dce0a9323d69'))
	// res.success(await Gitlab.getCommitBranch('47472', '8090e84398dba7bef122d89e7a50635497c06ecb'));
	// res.success(await Gitlab.getProject('devmgr_web'))
	// return res.success({ result: await UserTokens.find({}) });
	// return res.success({
	//     result: await UserTokens.insertLoginToken({
	//         type: 'ws',
	//         userId: 'asdasdasdsssssss',
	//         hashedToken: 'sad23asd345dfgsdsadss123'
	//         // deviceType: 'BCD',
	//         // serialNumber: 'ASDDFGFG45645'
	//     })
	// });
	// console.log(await User.update<UserModel>({ where: { _id: 132 } }, { account: 'newaccount' }));
	// return res.success({ result: await UserTokens.remove({ userId: 'asdasdasdsssssss' }) });
	// throw new Exception(new Error('cuo wu'));
	// throw new Exception(new Exception('cuo wu'));
}));

// get/post都可以，但是浏览器原生的EventSource对象只能get请求
router.get('/sse/test', function (req, res) {
	res.set({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform',
		'Connection': 'keep-alive',
		'X-Accel-Buffering': 'no'
	});
	res.flushHeaders();
	let count = 0;

	const intervalId = setInterval(() => {
		const data = {
			time: `Current time is ${new Date().toLocaleTimeString()}`
		};

		trace({
			traceId: httpContext.get('traceId'),
			spanId: httpContext.get('spanId'),
			parentSpanId: httpContext.get('parentSpanId')
		}, 'sse-response').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(data, null, '   ')}`);
		res.write(`data: ${JSON.stringify(data)}\n\n`);
		count++;
		if (count === 5) {
			const endMark = { streamEnd: true };

			trace({
				traceId: httpContext.get('traceId'),
				spanId: httpContext.get('spanId'),
				parentSpanId: httpContext.get('parentSpanId')
			}, 'sse-response').info(`${req.method}: ${req.originalUrl} => \n${JSON.stringify(endMark, null, '   ')}`);
			res.write(`data: ${JSON.stringify(endMark)}\n\n`);
			res.end();
		}
	}, 1000);

	req.on('close', () => {
		// eslint-disable-next-line no-console
		console.log('客户端断开，停止推送');
		clearInterval(intervalId);
		res.end();
	});
});
// router.get('/:userId', asyncHandler(async (req, res) => {
//     const Users = new _Users('11685');

//     // 6215a94749e853ee5e2df2b9 test123sss
//     // return res.success(await Users.findById(req.params.userId, { projection: { name: 1 } }));
//     return res.success(await Users.findById(req.params.userId));
// }));

export default router;
