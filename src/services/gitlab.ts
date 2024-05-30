import { Gitlab } from '@gitbeaker/rest';
import axios, { Method as AxiosMethod, AxiosResponse } from 'axios';
import Agent from 'agentkeepalive';
import { BaseRequest } from './HTTP';
import { Encryption } from './rsa';
import { log } from '@/configs';

const gitlabHost = 'https://gitlab.bj.sensetime.com';
const gitlabToken = '';

const GitlabServer = new class _Gitlab extends BaseRequest {
	server = axios.create({
		timeout: 10000,
		httpAgent: new Agent({
			keepAlive: true,
			maxSockets: 100,
			maxFreeSockets: 10,
			timeout: 60000, // active socket keepalive for 60 seconds
			freeSocketTimeout: 30000 // free socket keepalive for 30 seconds
		})
	});

	constructor() {
		super();
		// 请求拦截器
		this.server.interceptors.request.use(this.beforeSendToServer, this.beforeSendToServerButError);

		// 响应拦截器
		this.server.interceptors.response.use(this.receiveSuccessResponse, this.receiveResponseNotSuccess);
	}

	async receiveSuccessResponse(response: AxiosResponse) {
		// 这里只处理 response.status >= 200 && response.status <= 207 的情况
		const { data, config: { method, baseURL, url }/*, headers, request, status, statusText*/ } = response;
		const address = new URL(`${baseURL ? baseURL + url : url}`);

		log(`response-from:[(${method}) ${address.origin + address.pathname}]`).info(JSON.stringify(data, null, '   '));
		return Promise.resolve(response);
	}

	async sendToGitlab(method: AxiosMethod, url: string, options?: httpArgument) {
		return await this.send(url, method, gitlabHost, {
			...options,
			headers: {
				...options?.headers,
				'x-private-token': gitlabToken
			}
		});
	}
}

interface GitlabProject {
	id: number
	description: string
	name: string
	name_with_namespace: string
	path: string
	path_with_namespace: string
	created_at: string
	default_branch: string
	tag_list: Array<string>
	topics: Array<string>
	ssh_url_to_repo: string
	http_url_to_repo: string
	web_url: string
	readme_url?: string
	forks_count: number
	avatar_url?: string
	star_count: number
	last_activity_at: string
	namespace: {
		id: number
		name: string
		path: string
		kind: 'user'
		full_path: string
		parent_id?: string
		avatar_url: string
		web_url: string
	}
}


export default new class GitlabService {
	private gitlab: InstanceType<typeof Gitlab>;

	constructor() {
		this.gitlab = new Gitlab({
			host: gitlabHost,
			token: gitlabToken
		});
	}

	async getCurrentAccount() {
		return await this.gitlab.Users.showCurrentUser();
	}

	async addSSHKey() {
		const user = await this.getCurrentAccount();
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

	async getProject(projectName: string) {
		return (await this.gitlab.Projects.search(projectName)).find(a => a.name === projectName);
	}

	async pageProjects(skip = 0, limit = 10) {
		const { data, headers } = await GitlabServer.sendToGitlab('GET', '/api/v4/projects', {
			params: {
				simple: true,
				per_page: limit,
				page: skip / limit + 1
			}
		});
		const total = parseInt(headers['x-total'] as string);

		return { list: data as Array<GitlabProject>, total };
	}

	async getBranches(projectId: string) {
		return await this.gitlab.Branches.all(projectId);
	}

	async getBranch(projectId: string, branchName: string) {
		return await this.gitlab.Branches.show(projectId, branchName);
	}

	async getTags(projectId: string) {
		return await this.gitlab.Tags.all(projectId);
	}

	async getTag(projectId: string, tagName: string) {
		return await this.gitlab.Tags.show(projectId, tagName);
	}

	async getCommits(projectId: string, option?: { branchName?: string }, pagination?: { limit?: number, skip?: number }) {
		const { branchName } = option || {};
		const { skip = 0, limit = 10 } = pagination || {};

		return await this.gitlab.Commits.all(projectId, {
			refName: branchName,
			...!limit ? { all: true } : {
				pagination: 'offset',
				perPage: limit,
				page: skip / limit + 1
			}
		});
	}

	async getCommit(projectId: string, commitId: string) {
		return await this.gitlab.Commits.show(projectId, commitId);
	}

	async getCommitBranch(projectId: string, commitId: string) {
		// @ts-ignore
		return (await this.getCommit(projectId, commitId)).last_pipeline.ref
	}

	async getBranchLatestFile(projectId: string, branchName: string, filePath: string) {
		const fileContent = (await this.gitlab.RepositoryFiles.show(projectId, filePath, branchName)).content;

		return Buffer.from(fileContent, 'base64').toString('utf-8');
	}

	async getTagLatestFile(projectName: string, tagName: string, filePath: string) {
		const fileContent = (await this.gitlab.RepositoryFiles.show(projectName, filePath, tagName)).content;

		return Buffer.from(fileContent, 'base64').toString('utf-8');
	}

	async getCommitFile(projectId: string, commitId: string, filePath: string) {
		return await this.gitlab.RepositoryFiles.showRaw(projectId, filePath, commitId);
	}
}
