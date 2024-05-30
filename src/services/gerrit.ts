import axios, { Method as AxiosMethod, AxiosResponse } from 'axios';
import Agent from 'agentkeepalive';
import { BaseRequest } from './HTTP';
import { Encryption } from './rsa';

const GerritServer = new class _Gerrit extends BaseRequest {
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

	async sendToGerrit(method: AxiosMethod, url: string, options?: httpArgument) {
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

interface GerritTag {
	object?: string
	message?: string
	tagger?: {
		name: string
		email: string
	}
	created: string
	web_links: [{ name: string, url: string }]
	ref: `refs/tags/${string}`
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

// interface GerritRefLog {
// 	old_id: string
// 	new_id: string
// 	who: {
// 		name: string
// 		email: string
// 		date: string
// 		tz: number
// 	}
// 	comment: string
// }

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

interface GerritAccount {
	_account_id: number
	name: string
	email: string
	username: string
}

interface GerritSSHKey {
	seq: number
	ssh_public_key: string
	encoded_key: string
	algorithm: string
	comment: string
	valid: boolean
}

export default new class GerritService {
	constructor() {
		//
	}

	async getCurrentAccount() {
		const res = await GerritServer.sendToGerrit('get', '/accounts/self/');

		return GerritServer.getResponse(res) as GerritAccount;
	}

	async addSSHKey() {
		const user = await this.getCurrentAccount();
		const { privateKey, publicKey } = await Encryption.gererateGitSSHKey(user.email);
		const res = await GerritServer.sendToGerrit('post', '/accounts/self/sshkeys', {
			// @ts-ignore
			data: publicKey.replace('\n', ''),
			headers: {
				'Content-Type': 'text/plain'
			}
		});
		const sshKey = GerritServer.getResponse(res) as GerritSSHKey;

		return {
			privateKey,
			publicKey,
			sshKeyId: sshKey.seq
		};
	}

	async deleteSSHKey(keyId: number) {
		await GerritServer.sendToGerrit('delete', `/accounts/self/sshkeys/${keyId}`);
	}

	async projects() {
		const res = await GerritServer.sendToGerrit('get', '/projects/');

		return Object.values(GerritServer.getResponse(res)) as Array<GerritBaseProject>;
	}

	async getProject(projectName: string) {
		const res = await GerritServer.sendToGerrit('get', '/projects/', {
			params: {
				query: `name:${projectName}`
			}
		});

		return GerritServer.getResponse(res) as Array<GerritProject>;
	}

	async pageProjects(skip = 0, limit = 10) {
		const res = await GerritServer.sendToGerrit('get', '/projects/', {
			params: {
				limit,
				start: skip
			}
		});
		const total = (await this.projects()).length

		return {
			list: Object.values(GerritServer.getResponse(res)) as Array<GerritBaseProject>,
			total
		}
	}

	async getBranches(projectName: string) {
		const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/branches/`);

		return GerritServer.getResponse(res) as Array<GerritBranch>;
	}

	async getBranche(projectName: string, branchName: string) {
		const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/branches/${branchName}`);

		return GerritServer.getResponse(res) as GerritBranch;
	}

	// 需要owner权限
	// async getBranchRefLog(projectName: string, branchName: string) {
	// 	const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/branches/${branchName}/reflog`);

	// 	return GerritServer.getResponse(res) as Array<GerritRefLog>;
	// }

	async getTags(projectName: string) {
		const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/tags/`);

		return GerritServer.getResponse(res) as Array<GerritTag>;
	}

	async getTag(projectName: string, tagName: string) {
		const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/tags/${tagName}`);

		return GerritServer.getResponse(res) as GerritTag;
	}

	async getCommit(projectName: string, commitId: string) {
		const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/commits/${commitId}`);

		return GerritServer.getResponse(res) as GerritCommit;
	}

	async getCommitBranchsAndTags(projectName: string, commitId: string) {
		const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/commits/${commitId}/in`);

		return GerritServer.getResponse(res) as { branches: Array<string>, tags: Array<string> };
	}

	async getBranchLatestFile(projectName: string, branchName: string, filePath: string) {
		const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/branches/${branchName}/files/${filePath}/content`);

		return Buffer.from(res as unknown as string, 'base64').toString('utf-8');
	}

	async getTagLatestFile(projectName: string, tagName: string, filePath: string) {
		const commit = await this.getTag(projectName, tagName);

		return await this.getCommitFile(projectName, commit.revision, filePath);
	}

	async getCommitFile(projectName: string, commitId: string, filePath: string) {
		const res = await GerritServer.sendToGerrit('get', `/projects/${projectName}/commits/${commitId}/files/${filePath}/content`);

		return Buffer.from(res as unknown as string, 'base64').toString('utf-8');
	}

	async getChangeById(changeId: string) {
		const res = await GerritServer.sendToGerrit('get', `/changes/${changeId}`);

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
		const res = await GerritServer.sendToGerrit('get', `/changes/`, {
			params: {
				q: query.join('+')
			}
		})
		return GerritServer.getResponse(res) as Array<GerritChange>;
	}
}
