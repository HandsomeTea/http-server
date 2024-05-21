import { Gitlab } from '@gitbeaker/rest';


export default new class GitlabService {
	private gitlab: InstanceType<typeof Gitlab>;

	constructor() {
		this.gitlab = new Gitlab({
			host: 'https://gitlab.bj.sensetime.com/',
			token: ''
		});
	}

	public async getProject(projectName: string) {
		return (await this.gitlab.Projects.search(projectName)).find(a => a.name === projectName);
	}

	public async getBranches(projectId: string) {
		return await this.gitlab.Branches.all(projectId);
	}

	public async getBranch(projectId: string, branchName: string) {
		return await this.gitlab.Branches.show(projectId, branchName);
	}

	public async getTags(projectId: string) {
		return await this.gitlab.Tags.all(projectId);
	}

	public async getTag(projectId: string, tagName: string) {
		return await this.gitlab.Tags.show(projectId, tagName);
	}

	public async getCommits(projectId: string, option?: { branchName?: string }, pagination?: { limit?: number, skip?: number }) {
		const { branchName } = option || {};
		const { skip = 0, limit = 0 } = pagination || {};

		return await this.gitlab.Commits.all(projectId, {
			refName: branchName,
			...!limit ? { all: true } : {
				pagination: 'offset',
				perPage: limit,
				page: skip / limit + 1
			}
		});
	}

	public async getCommit(projectId: string, commitId: string) {
		return await this.gitlab.Commits.show(projectId, commitId);
	}

	public async getBranchLatestFile(projectId: string, branchName: string, filePath: string) {
		const fileContent = (await this.gitlab.RepositoryFiles.show(projectId, filePath, branchName)).content;

		return Buffer.from(fileContent, 'base64').toString('utf-8');
	}

	public async getTagLatestFile(projectName: string, tagName: string, filePath: string) {
		const fileContent = (await this.gitlab.RepositoryFiles.show(projectName, filePath, tagName)).content;

		return Buffer.from(fileContent, 'base64').toString('utf-8');
	}

	public async getCommitFile(projectId: string, commitId: string, filePath: string) {
		return await this.gitlab.RepositoryFiles.showRaw(projectId, filePath, commitId);
	}
}
