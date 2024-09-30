// import fs from 'fs';
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
	// res.success(await Gitlab.Project.getProjectById(222693))
	// res.success(await Gitlab.Job.runJob(48313, 6820980))
	// 6820978 6820979 6820980
	// res.success(await Gitlab.Package.publishPackageToProject(48313, {
	// 	name: 'use-commit-id',
	// 	version: '1.0.0',
	// 	file: {
	// 		name: 'var.yaml',
	// 		content: fs.readFileSync('/usr/src/app/var.yaml'),
	// 		path: '/usr/src/app/var.yaml'
	// 	}
	// }));
	// fs.writeFileSync('/usr/src/app/varss.yaml', await Gitlab.Package.downloadPackage(48313, {
	// 	name: 'use-commit-id',
	// 	version: '1.0.0',
	// 	filename: 'var.yaml'
	// }) as Buffer)
	// const response = await Gitlab.Job.downloadJobArtifacts(48313, 6850340, 'jdk_ri-8u40-b25-linux-x64-10_feb_2015.tar.gz', {
	// 	// response: true,
	// 	savePath: '/usr/src/app/jdk_ri-8u40-b25-linux-x64-10_feb_2015.tar.gz'
	// });
	// console.log(2);
	// const writeStream = fs.createWriteStream('/usr/src/app/jdk_ri-8u40-b25-linux-x64-10_feb_2015.tar.gz');
	// const stream = new WritableStream({
	// 	write(chunk) {
	// 		writeStream.write(chunk);
	// 	},
	// 	close() {
	// 		console.log(1, 'finish');
	// 	}
	// });
	// // @ts-ignore
	// response.pipeTo(stream);
	// res.success();
	// res.success(await Gitlab.Package.listPackageFiles(48313, 57));
	// res.success(await Gitlab.Package.deletePackage(48313, 57));
	// res.success(await Gitlab.Package.deletePackageFile(48313, 57, 116));

	// res.success(await Gitlab.getCommits(48313, { branchName: 'develop' }))
	// res.success(await Gitlab.getPipelineJobs(47472, 1094869))

	// 6808689 retry-> 6812036
	// 6808689 retry-> forbidden
	// 6812036 retry-> 6812231

	// res.success(await Gitlab.getJob(48313, 6808689))
	// res.success(await Gitlab.retryJob(48313, 6812036))
	// res.success(await Gitlab.retryJob(48313, 6808689))
	// res.success(await Gitlab.getJobLog(47472, 6533817));
	// res.success(await Gitlab.getProjectVariables(16714));
	// 选定未执行需要手动执行的job 6711806

	// 不执行，直接retry，测试未执行的job可否retry(结果是不可以retry,forbidden)，观察是否生成新的job(无)
	// 指定变量执行 runJob IMAGE_REGISTRY:registry.sensetime.com/ai-service_resource/cpp_build_123web，观察是否生成新的job(不生成，返回的是原来的jobid，也没有新的job记录，变量生效)
	// retry看是否使用默认设置的变量(没有使用默认变量，使用了上一步的自定义变量)，观察是否生成新的job(生成了新的job，返回新的jobid 6807625，有新的job记录)
	// 不指定变量，runJob看是否使用默认设置的变量，观察是否生成新的job (job无法运行，unplayed，尝试retry)
	// 尝试retry 6711806，看是否使用默认设置的变量，观察是否生成新的job (job无法运行，not retryed)
	// 尝试retry 6807625，看是否使用默认设置的变量(使用的是第二步的自定义变量)，观察是否生成新的job  (生成了新的job，返回新的jobid 6807828，有新的job记录)
	// 再次尝试runjob 6807625 看是否使用默认设置的变量，观察是否生成新的job (job无法运行，unplayed，尝试retry)
	// 再次尝试retry 6807828，看是否使用默认设置的变量(使用的是第二步的自定义变量)，观察是否生成新的job(生成了新的job，返回旧的jobid 6807828，有新的job记录id为6807867)
	// res.success(await Gitlab.retryJob(48313, 6807227));
	// res.success(await Gitlab.runJob(48313, 6721207));
	// res.success(await Gitlab.getProjectVariables(48313))
	// res.success(await Gitlab.pageProjects())
	// res.success(await Gitlab.downloadJobArtifacts(47472, 6533817, './job.log'));
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
