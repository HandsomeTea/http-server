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

	public async getProjectByCommit(projectId: string, commit: string) {
		return await this.gitlab.Commits.show(projectId, commit);
	}

	public async getProjectByBranch(projectId: string, branchName: string) {
		return await this.gitlab.Branches.show(projectId, branchName);
	}

	public async getTags(projectId: string) {
		return await this.gitlab.Tags.all(projectId);
	}

	public async getProjectByTag(projectId: string, tagName: string) {
		return await this.gitlab.Tags.show(projectId, tagName);
	}

	public async getBranchLatestFile(projectId: string, branchName: string, filePath: string) {
		const fileContent = (await this.gitlab.RepositoryFiles.show(projectId, filePath, branchName)).content;

		return Buffer.from(fileContent, 'base64').toString('utf-8');
	}
}
