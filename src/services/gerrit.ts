import axios, { Method as AxiosMethod, AxiosResponse } from 'axios';
import Agent from 'agentkeepalive';
import { BaseRequest } from './HTTP';

const GerritServer = new class _Gerrit extends BaseRequest {
	public server = axios.create({
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

	async sendGerrit(method: AxiosMethod, url: string, options?: httpArgument) {
		const user = '';
		const password = '';
		return await this.send(url, method, 'https://gerrit.bj.sensetime.com/a', {
			...options,
			headers: {
				...options?.headers,
				Authorization: `Basic ${Buffer.from(`${user}:${password}`, 'ascii').toString('base64')}`
			}
		});
	}

	getResponse(res: AxiosResponse) {
		return JSON.parse((res as unknown as string).replace(')]}\'', ''));
	}
}


interface GerritBaseProject {
	id: string
	state: string
}

interface GerritProject extends GerritBaseProject {
	name: string
	parent: string
	labels: Record<'Verified' | 'Code-Review', {
		values: Record<string, string>
		default_value: number
	}>
}

interface GerritBranch {
	web_links?: [{ name: string, url: string }]
	ref: `refs/heads/${string}`
	/** is also commit id */
	revision: string
}

interface GerritCommit {
	commit: string
	parents: Array<{
		commit: string
		subject: string
	}>
	author: { name: string, email: string }
	committer: { name: string, email: string }
	subject: string
	message: string
}

interface GerritChange {
	id: string
	project: string
	branch: string
	change_id: string
	subject: string
	status: 'NEW'
	created: string
	updated: string
	submit_type: 'MERGE_IF_NECESSARY'
	mergeable: boolean
	has_review_started: boolean
	owner: {
		_account_id: number
	}
}

export default new class GitlabService {
	constructor() {
		//
	}

	async projects() {
		const res = await GerritServer.sendGerrit('get', '/projects/');

		return GerritServer.getResponse(res) as Record<string, GerritBaseProject>;
	}

	async getProject(projectName: string) {
		const res = await GerritServer.sendGerrit('get', `/projects/${projectName}`);

		return GerritServer.getResponse(res) as GerritProject;
	}

	async seachProjects(option: { projectName?: string }) {
		const query: Array<string> = [];

		if (option.projectName) {
			query.push(`name:${option.projectName}`)
		}
		if (query.length === 0) {
			return [];
		}
		const res = await GerritServer.sendGerrit('get', '/projects/', {
			params: {
				query: query.join('+')
			}
		})
		return GerritServer.getResponse(res) as Array<Omit<GerritProject, 'labels'>>;
	}

	async getBranches(projectName: string) {
		const res = await GerritServer.sendGerrit('get', `/projects/${projectName}/branches/`);

		return GerritServer.getResponse(res) as Array<GerritBranch>;
	}

	async getBranche(projectName: string, branchName: string) {
		const res = await GerritServer.sendGerrit('get', `/projects/${projectName}/branches/${branchName}`);

		return GerritServer.getResponse(res) as GerritBranch;
	}

	async getTags(projectName: string) {
		const res = await GerritServer.sendGerrit('get', `/projects/${projectName}/tags/`);

		return GerritServer.getResponse(res) as Array<GerritBranch>;
	}

	async getTag(projectName: string, tagName: string) {
		const res = await GerritServer.sendGerrit('get', `/projects/${projectName}/tags/${tagName}`);

		return GerritServer.getResponse(res) as GerritBranch;
	}

	async getCommit(projectName: string, commitId: string) {
		const res = await GerritServer.sendGerrit('get', `/projects/${projectName}/commits/${commitId}`);

		return GerritServer.getResponse(res) as GerritCommit;
	}

	async getBranchLatestFile(projectName: string, branchName: string, filePath: string) {
		const res = await GerritServer.sendGerrit('get', `/projects/${projectName}/branches/${branchName}/files/${filePath}/content`);

		return Buffer.from(res as unknown as string, 'base64').toString('utf-8');
	}

	// async getTagLatestFile(projectName: string, tagName: string, filePath: string) {
	// 	const res = await GerritServer.sendGerrit('get', `/projects/${projectName}/tags/${tagName}/files/${filePath}/content`);

	// 	return Buffer.from(res as unknown as string, 'base64').toString('utf-8');
	// }

	async getCommitFile(projectName: string, commitId: string, filePath: string) {
		const res = await GerritServer.sendGerrit('get', `/projects/${projectName}/commits/${commitId}/files/${filePath}/content`);

		return Buffer.from(res as unknown as string, 'base64').toString('utf-8');
	}

	async getChangeById(changeId: string) {
		const res = await GerritServer.sendGerrit('get', `/changes/${changeId}`);

		return GerritServer.getResponse(res) as GerritChange;
	}

	async searchChanges(option: { status?: string, labels?: string }) {
		const query: Array<string> = [];

		if (option.status) {
			query.push(`status:${option.status}`)
		}
		if (option.labels) {
			query.push(`o:${option.labels}`)
		}
		if (query.length === 0) {
			return [];
		}
		const res = await GerritServer.sendGerrit('get', `/changes/`, {
			params: {
				q: query.join('+')
			}
		})
		return GerritServer.getResponse(res) as Array<GerritChange>;
	}
}
