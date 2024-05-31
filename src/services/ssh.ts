import { Client, ClientChannel, ConnectConfig } from 'ssh2';


export const SSH = class SSHService {
	private connection: Client | null = null;
	constructor() {
		this.connection = new Client();
	}

	async connect(target: ConnectConfig): Promise<boolean> {
		return await new Promise((resolve, reject) => {
			this.connection?.connect(target).on('error', (error) => {
				return reject(error);
			}).on('timeout', () => {
				return reject('timeout');
			}).on('ready', async () => {
				return resolve(true);
			});
		});
	}

	close() {
		this.connection?.end();
		this.connection = null;
	}

	exec(command: string, callback: (stream?: ClientChannel) => void) {
		this.connection?.exec(command, (err, stream) => {
			if (err) {
				return callback();
			}
			callback(stream);
		});
	}

	async execute(command: string): Promise<Array<{ stdout: string } | { stderr: string }>> {
		return new Promise((resolve, reject) => {
			const output: Array<{ stdout: string } | { stderr: string }> = [];

			this.connection?.exec(command, (err, stream) => {
				if (err) {
					return reject(err);
				}
				stream.on('close', () => {
					return resolve(output);
				}).on('data', (data: Buffer) => {
					output.push({ stdout: data.toString() });
				}).stderr.on('data', (data: Buffer) => {
					output.push({ stderr: data.toString() });
				});
			});
		});
	}
};
