import { spawn } from 'child_process';
import { Client, ConnectConfig } from 'ssh2';
import redisService from './Redis';

export default new class Command {
    async runLocalCommand(commands: Array<string>, bundleRecordId: string, listener?: (data: { stdout?: string, stderr?: string, timeout?: true }) => void) {
        await redisService.publishBundleLog(bundleRecordId, '\n');
        await redisService.publishBundleLog(bundleRecordId, '==============================', 'info');
        for (const cmd of commands) {
            await redisService.publishBundleLog(bundleRecordId, `command: ${cmd}`, 'info');
        }
        await redisService.publishBundleLog(bundleRecordId, '==============================', 'info');

        const subProcess = spawn('bash');

        let timer: NodeJS.Timeout | null = setTimeout(async () => {
            subProcess.kill();
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;

                if (listener) {
                    await listener({ timeout: true });
                }
            }
        }, 240 * 60 * 1000);

        subProcess.on('exit', () => {
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
        });

        subProcess.stdout.on('data', async data => {
            if (listener) {
                await listener({ stdout: data.toString() });
            }
        });
        subProcess.stderr.on('data', async data => {
            if (listener) {
                await listener({ stderr: data.toString() });
            }
        });

        await new Promise((resolve, reject) => {
            subProcess.on('error', error => {
                return reject(error);
            });

            subProcess.on('close', code => {
                return resolve({ code });
            });

            for (const command of commands) {
                subProcess.stdin.write(command + ' \n');
            }
            subProcess.stdin.end();
        });
    }

    async connectDevice(bundleRecordId: string, deviceConfig: ConnectConfig): Promise<Client | null> {
        return await new Promise(resolve => {
            const conn = new Client();

            conn.connect(deviceConfig)
                .on('error', async (error) => {
                    await redisService.publishBundleLog(bundleRecordId, error.message, 'error');
                    resolve(null);
                }).on('timeout', async () => {
                    await redisService.publishBundleLog(bundleRecordId, `device ${deviceConfig.host} connect timeout`, 'error');
                    resolve(null);
                }).on('greeting', async message => {
                    await redisService.publishBundleLog(bundleRecordId, message);
                }).on('ready', async () => {
                    await redisService.publishBundleLog(bundleRecordId, `device ${deviceConfig.host} connect success!`, 'info');
                    resolve(conn);
                });
        });
    }

    async runRemoteCommand(connection: Client, cmd: string, option?: {
        workDir?: string,
        bundleRecordId?: string,
        exportCmd?: string
    }): Promise<boolean> {
        const { workDir, bundleRecordId, exportCmd } = option || {};
        let command = workDir ? `cd ${workDir} && ${cmd}` : cmd;

        if (exportCmd) {
            command = `export ${exportCmd} && ${command}`;
        }

        if (bundleRecordId) {
            await redisService.publishBundleLog(bundleRecordId, '\n');
            await redisService.publishBundleLog(bundleRecordId, '==============================', 'info');
            await redisService.publishBundleLog(bundleRecordId, `command: ${cmd}`, 'info');
            await redisService.publishBundleLog(bundleRecordId, '==============================', 'info');
        }
        return await new Promise(resolve => {
            connection.exec(command, async (err, stream) => {
                if (err) {
                    if (bundleRecordId) {
                        await redisService.publishBundleLog(bundleRecordId, err.message, 'error');
                    }
                    return resolve(false);
                }

                stream.on('close', async () => {
                    resolve(true);
                }).on('data', async (data: Buffer) => {
                    if (bundleRecordId) {
                        await redisService.publishBundleLog(bundleRecordId, data.toString());
                    }
                }).stderr.on('data', async data => {
                    if (bundleRecordId) {
                        await redisService.publishBundleLog(bundleRecordId, data.toString());
                    }
                });
            });
        });
    }
};
