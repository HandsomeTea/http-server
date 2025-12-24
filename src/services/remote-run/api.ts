
/**
 * @api {post} /api/bundlemgr/v1/task 创建bundle任务
 * @apiName create-bundle-task
 * @apiGroup Bundle-mgr
 * @apiVersion 1.0.0
 * @apiBody {string} taskId bundle任务的父逻辑的id，如模型评测id，模型部署id等
 * @apiBody {string="model_deploy", "model_benchmark"} taskType 父逻辑的类型
 * @apiBody {object} env 执行命令的环境变量，环境变量的值只支持字符串和数字
 * @apiBody {array} files 执行命令的涉及的文件
 * @apiBody {string="file", "dir"} files.type 文件类型，file表示文件，dir表示目录(将获取到一个目录的压缩包，并解压到工作目录)
 * @apiBody {string} files.address 文件的下载地址
 * @apiBody {string} files.path 文件相对工作目录的路径，如果type是file，则应包括文件名
 * @apiBody {string} [files.envKey] 文件在环境变量中的key，如果不设置，则只准备文件，不会将文件设置到环境变量中
 * @apiBody {array} commands 执行的命令组
 * @apiBody {string} commands.name 命令组名称
 * @apiBody {array} commands.cmds 命令组要执行的命令
 * @apiBody {object} commands.device 执行该命令组需要的设备申请信息
 * @apiBody {string} [commands.device.id] 指定的设备的id，如果指定了id，则忽略tag和features
 * @apiBody {string} [commands.device.tag] 指定设备的标签，如果指定了tag和features，则忽略id
 * @apiBody {string} [commands.device.features] 指定的设备的features，如果指定了tag和features，则忽略id
 * @apiBody {array} commands.artifacts 执行该命令组产生的有效文件在工作目录中的相对路径，在下一个命令组中可以通过该路径获取到这些文件
 * @apiUse loginRequiredRequest
 */
// router.post('/', asyncHandler(async (req, res) => {
// 	const { taskId, taskType, env, files, commands } = req.body as {
// 		taskId: string
// 		taskType: BundleModel['type']
// 		env: Record<string, string | number>
// 		files: Array<{
// 			type: 'file' | 'dir'
// 			address: string
// 			path: string
// 			envKey?: string
// 		}>
// 		commands: Array<{
// 			name: string
// 			cmds: Array<string>
// 			device: {
// 				id?: string
// 				tag?: string
// 				features?: Array<string>
// 			}
// 			artifacts: Array<string>
// 		}>
// 	};

// 	if (!taskId) {
// 		throw new Exception('taskId is required', ErrorCode.INVALID_ARGUMENTS);
// 	}
// 	if (!new Set(['model_deploy', 'model_benchmark']).has(taskType)) {
// 		throw new Exception('taskType must be model_deploy or model_benchmark', ErrorCode.INVALID_ARGUMENTS);
// 	}
// 	if (!commands.find(a => !!a.device.id || (!!a.device.tag && Array.isArray(a.device.features) && a.device.features.length > 0))) {
// 		throw new Exception('device.id or device.tag and device.features must be specified', ErrorCode.INVALID_ARGUMENTS);
// 	}
// 	if (commands.map(a => a.artifacts).flat().find(a => a.startsWith('/'))) {
// 		throw new Exception('artifacts must not start with / and must not end with /', ErrorCode.INVALID_ARGUMENTS);
// 	}
// 	const user = req.headers['x-user'] as string;

// 	await BundleService.createTask({ taskId, taskType, env, files, commands }, user);
// 	res.success();
// }));
