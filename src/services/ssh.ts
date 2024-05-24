import { Client, ClientChannel, ConnectConfig } from 'ssh2';


export const SSH = class SSHService {
	private connection: Client | null = null;
	constructor() {
		this.connection = new Client();
	}

	async connect(target: ConnectConfig): Promise<boolean> {
		const conn = this.connection;

		if (!conn) {
			return false;
		}
		return await new Promise((resolve, reject) => {
			conn.connect(target).on('error', (error) => {
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

	async exec(command: string): Promise<ClientChannel | void> {
		const conn = this.connection;

		if (!conn) {
			return;
		}
		return await new Promise((resolve, reject) => {
			conn.exec(command, (err, stream) => {
				if (err) {
					return reject(err);
				}
				resolve(stream);
			});
		});
	}
};
