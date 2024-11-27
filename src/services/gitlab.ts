import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import { ArtifactSchema, BranchSchema, Gitlab, JobSchema, PackageSchema, PipelineSchema, ProjectSchema, TagSchema } from '@gitbeaker/rest';
import { GitbeakerRequestError } from '@gitbeaker/requester-utils';
import YAML from 'yaml';
// import axios, { Method as AxiosMethod, AxiosResponse } from 'axios';
// import Agent from 'agentkeepalive';
// import { fileFromPath } from 'formdata-node/file-from-path'
// import { BaseRequest } from './HTTP';
import { Encryption } from './rsa';
import { ErrorCode, log } from '@/configs';
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

const ExceptionHandler = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
	const _descriptor = descriptor.value;

	descriptor.value = async function (...args: Array<unknown>) {
		try {
			return await _descriptor.apply(this, args);
		} catch (error) {
			const errorStr = `execute ${target.constructor.name}.${propertyKey} error: ${(error as GitbeakerRequestError).cause?.description || error}`;

			if (error instanceof GitbeakerRequestError) {
				throw new Exception({
					message: errorStr,
					code: ErrorCode.REQUEST_GITLAB_ERROR,
					status: error.cause?.response.status || 500
				});
			}
			throw new Exception(errorStr, ErrorCode.REQUEST_GITLAB_ERROR);
		}
	};
}

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
class GitlabAccount extends GitlabBase {
	constructor() {
		super();
	}

	async getCurrentAccount() {
		return await this.gitlab.Users.showCurrentUser();
	}
}

class GitlabSSHKey extends GitlabBase {
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

interface GitlabGroupData {
	id: number
	name: string
	path: string
	full_name: string
	full_path: string
	parent_id: number | null
}

class GitlabGroup extends GitlabBase {
	constructor() {
		super();
	}

	async getGroup(group: { fullPath?: string, id?: number }): Promise<undefined | GitlabGroupData> {
		const { fullPath, id } = group;
		let result = null;

		if (id) {
			result = await this.gitlab.Groups.show(id);
		}

		if (fullPath) {
			result = (await this.gitlab.Groups.search(fullPath)).find(a => a.full_path === fullPath);
		}
		if (!result) {
			return;
		}
		return {
			id: result.id,
			name: result.name,
			path: result.path,
			'full_name': result.full_name as string,
			'full_path': result.full_path as string,
			'parent_id': result.parent_id as number | null
		};
	}

	async getProjectGroup(projectId: string | number, withParents = false) {
		const project = await this.gitlab.Projects.show(projectId);
		const group = await this.getGroup({ fullPath: project.namespace.full_path as string });

		if (!group) {
			return;
		}
		if (!withParents) {
			return { group };
		}
		let parent: typeof group | undefined = group;
		const parents: Record<string, GitlabGroupData> = {
			[parent.full_path]: parent
		};

		while (parent && parent.parent_id) {
			parent = await this.getGroup({ id: parent.parent_id });

			if (parent) {
				parents[parent.full_path] = parent;
			}
		}
		return { group, parents };
	}
}

class GitlabProject extends GitlabBase {
	constructor() {
		super();
	}

	async getProjectByName(projectName: string, withGroup = false) {
		return (await this.gitlab.Projects.search(projectName)).find(a => !withGroup ? a.name === projectName : a.path_with_namespace === projectName);
	}

	@ExceptionHandler
	async getProjectById(projectId: string | number) {
		return await this.gitlab.Projects.show(projectId);
	}

	async pageProjects(skip = 0, limit = 10) {
		const { body, headers } = await this.gitlab.Projects.requester.get('/api/v4/projects', {
			searchParams: {
				simple: true,
				per_page: limit,
				page: skip / limit + 1
			}
		});
		const total = parseInt(headers['x-total']);

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

	/** 将目标文件夹打包为一个压缩包并以流的形式返回,如果文件夹不存在，则返回空流 */
	async getProjectDirFiles(projectId: string | number, option: { commitId?: string, dirPath?: string }, savePath?: string) {
		const { commitId, dirPath } = option;
		const response = await this.gitlab.Repositories.showArchive(projectId, { sha: commitId, asStream: true, path: dirPath, fileType: 'tar.gz' });

		if (savePath) {
			const saveAt = path.join(savePath, 'archive.zip');
			const writeStream = fs.createWriteStream(saveAt);

			return new Promise(resolve => {
				const stream = new WritableStream({
					write(chunk) {
						writeStream.write(chunk);
					},
					close() {
						resolve(saveAt);
					}
				});
				response.pipeTo(stream);
			});
		}
		return response;
	}
}

class GitlabBranch extends GitlabBase {
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
		const total = parseInt(headers['x-total']);

		return { list: body as unknown as Array<BranchSchema>, total };
	}
}

class GitlabTag extends GitlabBase {
	constructor() {
		super();
	}

	async createTag(projectId: string | number, tagName: string, ref: string) {
		return await this.gitlab.Tags.create(projectId, tagName, ref);
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
		const total = parseInt(headers['x-total']);

		return { list: body as unknown as Array<TagSchema>, total };
	}
}

class GitlabCommit extends GitlabBase {
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

	async getCommitRefs(projectId: string | number, commitId: string, firstBranch = false) {
		const refs = await this.gitlab.Commits.allReferences(projectId, commitId);

		if (firstBranch) {
			return refs.find(a => a.type === 'branch');
		}
		return refs;
	}

	async getCommitCiConfig(projectId: string | number, commitId: string) {
		const project = await Project.getProjectById(projectId);
		const yaml = await this.gitlab.RepositoryFiles.showRaw(projectId, '.gitlab-ci.yml', commitId) as string
		const result = await this.gitlab.requester.post('/api/graphql', {
			body: {
				operationName: 'getCiConfigData',
				variables: JSON.stringify({
					sha: commitId,
					projectPath: project.path_with_namespace,
					content: yaml
				}),
				query: `
				query getCiConfigData($projectPath: ID!, $sha: String, $content: String!) {
  					ciConfig(projectPath: $projectPath, sha: $sha, content: $content) {
    					errors
						includes {
							location
							type
							blob
							raw
							__typename
						}
						mergedYaml
						status
  					}
				}
			`
			}
		});
		const data = result.body as {
			data: { ciConfig?: { status: 'INVALID' | 'VALID', mergedYaml: string, errors: string[] } }
			errors: Array<{
				message: string
				locations: Array<{ line: number, column: number }>
				path: Array<string>
			}>
		};

		if (!data.data.ciConfig || data.data.ciConfig.status === 'INVALID') {
			let errorStr = 'unknown error';

			if (data.errors) {
				errorStr = data.errors.map(e => `${e.message} at ${e.locations.map(l => `line ${l.line}, column ${l.column}`).join(', ')}`).join(', ');
			} else if (data.data.ciConfig?.errors) {
				errorStr = data.data.ciConfig.errors.join(', ');
			}
			log().error(`get ci config from project ${projectId} with commit ${commitId} failed: ${errorStr}`, ErrorCode.INVALID_ARGUMENTS);
			return {};
		}
		return YAML.parse(data.data.ciConfig.mergedYaml);
	}

	async getCommitJobArtifactsList(projectId: string | number, commitId: string, jobName: string) {
		const ci = await this.getCommitCiConfig(projectId, commitId);

		return (ci[jobName]?.artifacts?.paths || [])
			// .filter((a: string) => a.startsWith('$CI_PROJECT_DIR/'))
			// .map((a: string) => a.replace('$CI_PROJECT_DIR/', ''))
			.sort((a: string, b: string) => a.length - b.length) as Array<string>
	}
}

class GitlabPipeline extends GitlabBase {
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
	async createPipeline(projectId: string | number, ref: { branch?: string, tag?: string }, variables?: Array<{ key: string, value: string }>) {
		if (!ref.branch && !ref.tag) {
			return;
		}
		return await this.gitlab.Pipelines.create(projectId, (ref.branch || ref.tag), { variables });
	}

	async getProjectPiepelines(projectId: string | number, pagination?: { limit?: number, skip?: number }) {
		const { skip = 0, limit = 10 } = pagination || {};
		const { body, headers } = await this.gitlab.Pipelines.requester.get(`/api/v4/projects/${projectId}/pipelines`, {
			searchParams: {
				per_page: limit,
				page: skip / limit + 1
			}
		});
		const total = parseInt(headers['x-total']);

		return { list: body as unknown as Array<PipelineSchema>, total };
	}

	async getPipelineByCommitId(projectId: string | number, sha: string) {
		return await this.gitlab.Pipelines.all(projectId, { sha })
	}

	async getPipeline(projectId: string | number, pipelineId: number) {
		return await this.gitlab.Pipelines.show(projectId, pipelineId);
	}

	async getPipelineJobDependencies(projectId: string | number, pipelineId: number) {
		const pipeline = await this.getPipeline(projectId, pipelineId);
		const project = await Project.getProjectById(projectId);

		const { body } = await this.gitlab.requester.post('/api/graphql', {
			body: {
				operationName: 'getDagVisData',
				variables: JSON.stringify({
					iid: pipeline.iid,
					projectPath: project.path_with_namespace
				}),
				query: `
				query getDagVisData($projectPath: ID!, $iid: ID!) {
					project(fullPath: $projectPath) {
						id
						pipeline(iid: $iid) {
							id
							stages {
								nodes {
									id
									name
									groups {
										nodes {
											id
											name
											size
											jobs {
												nodes {
													id
													name
													needs {
														nodes {
															id
															name
															__typename
														}
														__typename
													}
													__typename
												}
												__typename
											}
											__typename
										}
										__typename
									}
									__typename
								}
								__typename
							}
							__typename
						}
						__typename
					}
				}
			`
			}
		});

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const data = body.data.project.pipeline.stages.nodes;
		const result: {
			stages: Record<string, Array<string>>,
			jobs: Array<{ id: number, name: string }>,
			jobNeeds: Record<string, Array<string>>
		} = {
			stages: {},
			jobs: [],
			jobNeeds: {}
		};

		for (const stage of data) {
			const stageName = stage.name;
			const jobs = stage.groups.nodes;
			const jobNames = [];

			for (const job of jobs) {
				const _job = job.jobs.nodes[0];

				jobNames.push(_job.name);
				result.jobs.push({
					id: parseInt(_job.id.match(/\/[0-9].*/)[0].replace('/', '')),
					name: _job.name
				});

				const needs = _job.needs.nodes;

				if (needs.length > 0) {
					const needsJobNames = [];

					for (const need of needs) {
						needsJobNames.push(need.name)
					}
					result.jobNeeds[job.name] = needsJobNames;
				}
			}
			result.stages[stageName] = jobNames;
		}
		return result;
	}
}

class GitlabJob extends GitlabBase {
	constructor() {
		super();
	}

	private formatJob(job: JobSchema) {
		return {
			id: job.id,
			status: job.status,
			stage: job.stage,
			name: job.name,
			ref: job.ref,
			created_at: job.created_at,
			started_at: job.started_at,
			finished_at: job.finished_at,
			erased_at: job.erased_at,
			commit: {
				id: job.commit.id,
				short_id: job.commit.short_id,
				created_at: job.commit.created_at,
				message: job.commit.message,
				committer_name: job.commit.committer_name,
				committer_email: job.commit.committer_email,
				committed_date: job.commit.committed_date
			},
			pipeline: {
				id: job.pipeline.id,
				iid: job.pipeline.iid,
				project_id: job.pipeline.project_id,
				sha: job.pipeline.sha,
				ref: job.pipeline.ref,
				status: job.pipeline.status
			},
			artifacts: job.artifacts,
			artifacts_expire_at: job.artifacts_expire_at
		};
	}

	async getPipelineJobs(projectId: string | number, pipelineId: number) {
		return (await this.gitlab.Jobs.all(projectId, { pipelineId })).map(job => this.formatJob(job as JobSchema));
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
				const writeStream = fs.createWriteStream(option.savePath);
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

	async downloadJobArchive(projectId: string | number, tagName: string, jobName: string) {
		return (await this.gitlab.JobArtifacts.requester.get(`/api/v4/projects/${projectId}/jobs/artifacts/${tagName}/download?job=${jobName}`, {
			asStream: true
		})).body as ReadableStream;
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

	async removeJob(projectId: string | number, jobId: number) {
		return await this.gitlab.Jobs.erase(projectId, jobId);
	}

	async jobHasArtifacts(projectId: string | number, jobId: number) {
		const job = await this.getJob(projectId, jobId);

		return !!(job.artifacts as Array<ArtifactSchema>).find(a => a.file_type === 'archive');
	}

	async getJobArtifactsExpiredAt(projectId: string | number, jobId: number) {
		return (await this.getJob(projectId, jobId)).artifacts_expire_at as string | null;
	}

	async removeJobArtifacts(projectId: string | number, jobId: number) {
		return await this.gitlab.JobArtifacts.remove(projectId, { jobId });
	}

	async getNeedsJob(projectId: string | number, jobId: number) {
		const job = await this.getJob(projectId, jobId);
		const { jobNeeds, jobs } = await Piepeline.getPipelineJobDependencies(projectId, job.pipeline.id);
		const needs = jobNeeds[job.name];

		if (needs && needs.length > 0) {
			return jobs.filter(a => needs.includes(a.name));
		}
		return [];
	}

	async getJobStatusByName(projectId: string | number, pipelineId: number, jobName: string): Promise<{
		id: number
		status: 'ok' | 'running' | 'created' | 'expired' | 'failed'
		stage: string
	} | undefined> {
		const pipelineJobs = await this.getPipelineJobs(projectId, pipelineId);
		const job = pipelineJobs.find(j => j.name === jobName);

		if (!job) {
			return;
		}
		if (job.status === 'manual' || job.status === 'skipped' || job.status === 'created') {
			return {
				status: 'created',
				id: job.id,
				stage: job.stage
			};
		}
		if (job.status === 'failed') {
			return {
				status: 'failed',
				id: job.id,
				stage: job.stage
			};
		}

		if (job.status === 'pending' || job.status === 'running') {
			return {
				status: 'running',
				id: job.id,
				stage: job.stage
			};
		}
		if (job.status === 'success' && job.artifacts_expire_at && new Date().getTime() > new Date(job.artifacts_expire_at).getTime()) {
			return {
				status: 'expired',
				id: job.id,
				stage: job.stage
			};
		}
		return {
			status: 'ok',
			id: job.id,
			stage: job.stage
		};
	}
}

class GitlabPackage extends GitlabBase {
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

		return JSON.parse(data.toString()) as {
			id: number
			package_id: number
			created_at: string
			updated_at: string
			size: number
			file_name: string
			file_sha256: string
			status: 'default' | 'hidden'
		};
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
		const total = parseInt(headers['x-total']);

		return { list: body as unknown as Array<PackageSchema>, total };
	}

	async downloadPackageFile(projectId: string | number, packageFileInfo: { name: string, version: string, filename: string }, blob?: boolean) {
		const { name, version, filename } = packageFileInfo;
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

class GitlabFile extends GitlabBase {
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

class GitlabVariables extends GitlabBase {
	constructor() {
		super();
	}

	async getGroupVariables(groupId: string | number) {
		try {
			return await this.gitlab.GroupVariables.all(groupId);
		} catch (e) {
			const error = e as { cause?: { description: string } };

			log().warn(`get gitlab group variables from group ${groupId} error : ${JSON.stringify(error.cause)}`);
			return [];
		}
	}

	async getProjectVariables(projectId: string | number) {
		try {
			return await this.gitlab.ProjectVariables.all(projectId);
		} catch (e) {
			const error = e as { cause?: { description: string } };

			log().warn(`get gitlab project variables from project ${projectId} error : ${JSON.stringify(error.cause)}`);
			return [];
		}
	}

	async getPipelineVariables(projectId: string | number, pipelineId: number) {
		const pipeline = await this.gitlab.Pipelines.show(projectId, pipelineId);
		const ci = await Commit.getCommitCiConfig(projectId, pipeline.sha) as unknown as { variables?: Record<string, string> };

		return ci.variables || {};
	}

	async getJobVariables(projectId: string | number, pipelineId: number, jobName: string) {
		const pipeline = await this.gitlab.Pipelines.show(projectId, pipelineId);
		const ci = await Commit.getCommitCiConfig(projectId, pipeline.sha) as unknown as Record<string, { variables?: Record<string, string> }>;

		return ci[jobName]?.variables || {};
	}
}

export const Account = new GitlabAccount();
export const SSHKey = new GitlabSSHKey();
export const Group = new GitlabGroup();
export const Project = new GitlabProject();
export const Branch = new GitlabBranch();
export const Tag = new GitlabTag();
export const Commit = new GitlabCommit();
export const Piepeline = new GitlabPipeline();
export const Job = new GitlabJob();
export const Package = new GitlabPackage();
export const File = new GitlabFile();
export const Variables = new GitlabVariables();
