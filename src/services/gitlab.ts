import child_process from 'child_process';
import fs from 'fs';
import { BranchSchema, Gitlab, PackageSchema, PipelineSchema, ProjectSchema, TagSchema } from '@gitbeaker/rest';
// import axios, { Method as AxiosMethod, AxiosResponse } from 'axios';
// import Agent from 'agentkeepalive';
// import { fileFromPath } from 'formdata-node/file-from-path'
// import { BaseRequest } from './HTTP';
import { Encryption } from './rsa';
// import { log } from '@/configs';

const gitlabHost = 'https://gitlab.bj.sensetime.com';
const gitlabToken = '';

// const GitlabServer = new class _Gitlab extends BaseRequest {
// 	server = axios.create({
// 		timeout: 10000,
// 		httpAgent: new Agent({
// 			keepAlive: true,
// 			maxSockets: 100,
// 			maxFreeSockets: 10,
// 			timeout: 60000, // active socket keepalive for 60 seconds
// 			freeSocketTimeout: 30000 // free socket keepalive for 30 seconds
// 		})
// 	});

// 	constructor() {
// 		super();
// 		// 请求拦截器
// 		this.server.interceptors.request.use(this.beforeSendToServer, this.beforeSendToServerButError);

// 		// 响应拦截器
// 		this.server.interceptors.response.use(this.receiveSuccessResponse, this.receiveResponseNotSuccess);
// 	}

// 	async receiveSuccessResponse(response: AxiosResponse) {
// 		// 这里只处理 response.status >= 200 && response.status <= 207 的情况
// 		const { data, config: { method, baseURL, url }/*, headers, request, status, statusText*/ } = response;
// 		const address = new URL(`${baseURL ? baseURL + url : url}`);

// 		log(`response-from:[(${method}) ${address.origin + address.pathname}]`).info(JSON.stringify(data, null, '   '));
// 		return Promise.resolve(response);
// 	}

// 	async sendToGitlab(method: AxiosMethod, url: string, options?: httpArgument) {
// 		return await this.send(url, method, gitlabHost, {
// 			...options,
// 			headers: {
// 				...options?.headers,
// 				// 'x-private-token': gitlabToken
// 				Authorization: `Bearer ${gitlabToken}`
// 			}
// 		});
// 	}
// }

/**
 * @param {string} ref 分支名称，tag名称，commitid
 */
class GitlabBase {
	public gitlab: InstanceType<typeof Gitlab>;

	protected constructor() {
		this.gitlab = new Gitlab({
			host: gitlabHost,
			token: gitlabToken
		});
	}
}
const Account = new class GitlabAccount extends GitlabBase {
	constructor() {
		super();
	}

	async getCurrentAccount() {
		return await this.gitlab.Users.showCurrentUser();
	}
}

const SSHKey = new class GitlabSSHKey extends GitlabBase {
	constructor() {
		super();
	}

	async addSSHKey() {
		const user = await Account.getCurrentAccount();
		const { privateKey, publicKey } = await Encryption.gererateGitSSHKey(user.email);
		const sshKey = await this.gitlab.UserSSHKeys.add(`temp-sshkey-${new Date().getTime()}`, publicKey);

		return {
			privateKey,
			publicKey,
			sshKeyId: sshKey.id
		};
	}

	async deleteSSHKey(keyId: number) {
		return await this.gitlab.UserSSHKeys.remove(keyId);
	}
};

const Project = new class GitlabProject extends GitlabBase {
	constructor() {
		super();
	}

	async getProject(projectName: string) {
		return (await this.gitlab.Projects.search(projectName)).find(a => a.name === projectName);
	}

	async pageProjects(skip = 0, limit = 10) {
		const { body, headers } = await this.gitlab.Projects.requester.get('/api/v4/projects', {
			searchParams: {
				simple: true,
				per_page: limit,
				page: skip / limit + 1
			}
		});
		const total = parseInt(headers['x-total'] as string);

		return { list: body as unknown as Array<ProjectSchema>, total };
	}

	async getProjectVariables(projectId: string | number) {
		return await this.gitlab.ProjectVariables.all(projectId);
	}

	async getUserOwnedProject(user?: { userId?: number, username?: string }) {
		let { userId = '', username = '' } = user || {};

		if (!userId && !username) {
			const currentUser = await Account.getCurrentAccount();

			username = currentUser.username;
			userId = currentUser.id;
		}
		return await this.gitlab.Users.allProjects(userId);
	}

	async getProjectUsers(projectId: string | number) {
		return await this.gitlab.Projects.allUsers(projectId);
	}
}

const Branch = new class GitlabBranch extends GitlabBase {
	constructor() {
		super();
	}

	async getBranch(projectId: string | number, branchName: string) {
		return await this.gitlab.Branches.show(projectId, branchName);
	}

	async pageBranches(projectId: string | number, pagination?: { limit?: number, skip?: number }) {
		const { skip = 0, limit = 10 } = pagination || {};
		const { body, headers } = await this.gitlab.Branches.requester.get(`/api/v4/projects/${projectId}/repository/branches`, {
			searchParams: {
				per_page: limit,
				page: skip / limit + 1
			}
		});
		const total = parseInt(headers['x-total'] as string);

		return { list: body as unknown as Array<BranchSchema>, total };
	}
}

const Tag = new class GitlabTag extends GitlabBase {
	constructor() {
		super();
	}

	async getTag(projectId: string | number, tagName: string) {
		return await this.gitlab.Tags.show(projectId, tagName);
	}

	async pageTags(projectId: string | number, pagination?: { limit?: number, skip?: number }) {
		const { skip = 0, limit = 10 } = pagination || {};
		const { body, headers } = await this.gitlab.Tags.requester.get(`/api/v4/projects/${projectId}/repository/tags`, {
			searchParams: {
				per_page: limit,
				page: skip / limit + 1
			}
		});
		const total = parseInt(headers['x-total'] as string);

		return { list: body as unknown as Array<TagSchema>, total };
	}
}

const Commit = new class GitlabCommit extends GitlabBase {
	constructor() {
		super();
	}

	async getCommits(projectId: string | number, option?: { ref?: string }, pagination?: { limit?: number, skip?: number }) {
		const { ref } = option || {};
		const { skip = 0, limit = 10 } = pagination || {};

		// commit使用requester获取也不返回total
		return await this.gitlab.Commits.all(projectId, {
			refName: ref,
			...!limit ? { all: true } : {
				pagination: 'offset',
				perPage: limit,
				page: skip / limit + 1
			}
		});
	}

	async getCommit(projectId: string | number, commitId: string) {
		return await this.gitlab.Commits.show(projectId, commitId);
	}
}

const Piepeline = new class GitlabPipeline extends GitlabBase {
	constructor() {
		super();
	}

	/**
	 * 返回新的pipeline信息
	 * @param projectId
	 * @param ref
	 * @param variables 传入的变量值会覆盖新的pipeline中所有job里使用到的原本的变量值
	 * @returns
	 */
	async createPipeline(projectId: string | number, ref: string, variables?: Array<{ key: string, value: string }>) {
		return await this.gitlab.Pipelines.create(projectId, ref, { variables });
	}

	async getProjectPiepelines(projectId: string | number, pagination?: { limit?: number, skip?: number }) {
		const { skip = 0, limit = 10 } = pagination || {};
		const { body, headers } = await this.gitlab.Pipelines.requester.get(`/api/v4/projects/${projectId}/pipelines`, {
			searchParams: {
				per_page: limit,
				page: skip / limit + 1
			}
		});
		const total = parseInt(headers['x-total'] as string);

		return { list: body as unknown as Array<PipelineSchema>, total };
	}

	async getPipelineByCommitId(projectId: string | number, sha: string) {
		return await this.gitlab.Pipelines.all(projectId, { sha })
	}
}

const Job = new class GitlabJob extends GitlabBase {
	constructor() {
		super();
	}

	async getPipelineJobs(projectId: string | number, pipelineId: number) {
		return await this.gitlab.Jobs.all(projectId, { pipelineId });
	}

	async getJob(projectId: string | number, jobId: number) {
		return await this.gitlab.Jobs.show(projectId, jobId);
	}

	/**
	 * 没有执行过的job不可以被retry
	 * retry会生成新的job，返回新的job id
	 * retry过的job，不可以再次retry，生成的新的job可以retry
	 */
	async retryJob(projectId: string | number, jobId: number) {
		return await this.gitlab.Jobs.retry(projectId, jobId);
	}

	async retryPipelineJobs(projectId: string | number, pipelineId: number) {
		return await this.gitlab.Pipelines.retry(projectId, pipelineId);
	}

	/** 正在执行的job也可以获取其日志 */
	async getJobLog(projectId: string | number, jobId: number) {
		return await this.gitlab.Jobs.requester.get(`/api/v4/projects/${projectId}/jobs/${jobId}/trace`);
	}

	/**
	 * 下载某个job的artifacts
	 * @param projectId
	 * @param jobId
	 * @param artifactPath 该路径相对于项目根路径的路径，如某个job定义了artifacts输出为项目跟路劲下的test.txt,则artifactPath为test.txt即可
	 * @param {boolean} [option.response] 直接返回response，会立即返回，不会等待下载完成再返回
	 * @param {string} [option.savePath] 传入一个文件路径(包括文件名)，直接将response下载的文件报错到该路径，不会立即返回，会等待下载保存完成再返回
	 * @returns
	 */
	async downloadJobArtifacts(projectId: string | number, jobId: number, artifactPath: string, option: { response?: boolean, savePath?: string }): Promise<ReadableStream | undefined> {
		// const blobData = await this.gitlab.JobArtifacts.downloadArchive(projectId, { jobId, artifactPath });
		// if (blob) {
		// 	return blobData;
		// }
		// const arrBuf = await blobData.arrayBuffer();

		// return Buffer.from(arrBuf);
		if (!option.response && !option.savePath) {
			return undefined;
		}

		const responseObj = (await this.gitlab.JobArtifacts.requester.get(`/api/v4/projects/${projectId}/jobs/${jobId}/artifacts/${artifactPath}`, {
			asStream: true
		})).body as ReadableStream;

		if (option.response) {
			return responseObj;
		} else {
			return new Promise(resolve => {
				const writeStream = fs.createWriteStream(option.savePath as string);
				const stream = new WritableStream({
					write(chunk) {
						writeStream.write(chunk);
					},
					close() {
						resolve(undefined)
					}
				});
				responseObj.pipeTo(stream);
			})
		}
	}

	/**
	 * 执行某个状态为manual(需要手动触发)的job，不会生成新的job
	 * 使用了变量run的job，retry时会使用run时的变量值，不会使用原先的变量值
	 */
	async runJob(projectId: string | number, jobId: number, variables?: Array<{ key: string, value: string }>) {
		return await this.gitlab.Jobs.play(projectId, jobId, {
			jobVariablesAttributes: variables && variables.length > 0 ? variables : []
		});
	}
}

const Package = new class GitlabPackage extends GitlabBase {
	constructor() {
		super();
	}

	/**
	 * 文件如果不是压缩包，则会在文件内容前写入请求头信息，所以最好上传一个压缩包，如果使用curl命令则没有这个问题
	 * 也可以在cicd的yaml中使用指令上传
	 * https://docs.gitlab.com/ee/user/packages/generic_packages/#publish-a-generic-package-by-using-cicd
	 * @param projectId
	 * @param packageInfo
	 * @returns
	 */
	async publishPackageToProject(projectId: string | number, packageInfo: { name: string, version: string, file: { path: string, content: Buffer, name: string } }, hidden?: boolean) {
		const { name, version, file } = packageInfo;

		const data = child_process.execSync(`curl --user "user:${gitlabToken}" --upload-file ${file.path} "${gitlabHost}/api/v4/projects/${projectId}/packages/generic/${name}/${version}/${file.name}?select=package_file&status=${hidden ? 'hidden' : 'default'}"`)

		return JSON.parse(data.toString());
		// 不会返回创建信息
		// return await this.gitlab.PackageRegistry.publish(projectId, name, version,
		// 	{
		// 		filename: file.name,
		// 		content: new Blob([file.content])
		// 	},
		// 	{
		// 		status: hidden ? 'hidden' : 'default',
		// 		select: 'package_file'
		// 	}
		// );

		// 会返回创建信息
		// return await this.gitlab.PackageRegistry.requester.put(`/api/v4/projects/${projectId}/packages/generic/${name}/${version}/${file.name}`, {
		// 	searchParams: {
		// 		status: hidden ? 'hidden' : 'default',
		// 		select: 'package_file'
		// 	},
		// 	body: await (async () => {
		// 		const form = new FormData();

		// 		form.append('upload_file', await fileFromPath(file.path));
		// 		return form;
		// 	})()
		// })

		// 使用原生的方法依然会导致上传的文件，内容前写入请求头信息
		// const form = new FormData();

		// form.append('upload_file', await fileFromPath(file.path));
		// return (await GitlabServer.server.put(`/api/v4/projects/${projectId}/packages/generic/${name}/${version}/${file.name}`, form, {
		// 	params: {
		// 		status: hidden ? 'hidden' : 'default',
		// 		select: 'package_file'
		// 	},
		// 	baseURL: gitlabHost,
		// 	headers: {
		// 		'Content-Type': 'application/octet-stream',
		// 		Authorization: `Bearer ${gitlabToken}`
		// 	}
		// })).data;
	}

	async pageProjectPackages(projectId: string | number, pagination?: { limit?: number, skip?: number }) {
		const { skip = 0, limit = 10 } = pagination || {};
		const { body, headers } = await this.gitlab.Packages.requester.get(`/api/v4/projects/${projectId}/packages`, {
			searchParams: {
				per_page: limit,
				page: skip / limit + 1
			}
		});
		const total = parseInt(headers['x-total'] as string);

		return { list: body as unknown as Array<PackageSchema>, total };
	}

	async downloadPackage(projectId: string | number, packageInfo: { name: string, version: string, filename: string }, blob?: boolean) {
		const { name, version, filename } = packageInfo;
		const blobData = await this.gitlab.PackageRegistry.download(projectId, name, version, filename) as unknown as Blob;

		if (blob) {
			return blobData;
		}
		const arrBuf = await blobData.arrayBuffer();

		return Buffer.from(arrBuf);
	}

	async deletePackage(projectId: string | number, packageId: number) {
		return await this.gitlab.Packages.remove(projectId, packageId)
	}

	async listPackageFiles(projectId: string | number, packageId: number) {
		return await this.gitlab.Packages.allFiles(projectId, packageId)
	}

	async deletePackageFile(projectId: string | number, packageId: number, fileId: number) {
		return await this.gitlab.Packages.removeFile(projectId, packageId, fileId);
	}
}

const File = new class GitlabFile extends GitlabBase {
	constructor() {
		super();
	}

	async getRefFile(projectId: string | number, ref: string, filePath: string) {
		return await this.gitlab.RepositoryFiles.showRaw(projectId, filePath, ref);
		// const fileContent = (await this.gitlab.RepositoryFiles.show(projectId, filePath, ref)).content;

		// return Buffer.from(fileContent, 'base64').toString('utf-8');
	}

	/**
	 * https://docs.gitlab.com/ee/api/projects.html#upload-a-file
	 * Uploads a file to the specified project to be used in an issue or merge request description, or a comment.
	 */
	async uploadFileUseForDescription(projectId: string | number, file: { content: Blob, filename: string }) {
		return await this.gitlab.Projects.uploadForReference(projectId, file);
	}

	/**
	 * @param {string} [option.pathInProject] 是指在项目根路径下的路径,不以/开头,有文件夹的路径会自动创建文件夹，取值如：文件test.txt或文件夹test/test.txt等
	 */
	async uploadFileToProject(projectId: string | number, option: { pathInProject: string, branch: string, fileContent: string, describtion: string }) {
		const { pathInProject, branch, fileContent, describtion } = option;

		return await this.gitlab.RepositoryFiles.create(projectId, pathInProject, branch, fileContent, describtion)
	}
}

export default {
	Account,
	SSHKey,
	Project,
	Branch,
	Tag,
	Commit,
	Piepeline,
	Job,
	Package,
	File
}
