import { spawn, ChildProcessWithoutNullStreams, exec, ExecException } from 'child_process';
import { Client } from 'ssh2';

const MAX_TAIL_SIZE = 1024;
const LOCAL_COMMAND_RUN_TIMEOUT = 240; // 分钟
const STOP_INTERVAL = 15 * 1000;

export class LocalShell {
    private shell: ChildProcessWithoutNullStreams | null = null;
    private currentResolver: ((success: boolean) => void) | null = null;
    private tailBuffer: string = '';
    private delimiter = '';
    private timeoutTimer: NodeJS.Timeout | null = null;
    private isStop = false;
    private stopTimer: NodeJS.Timeout | null = null;

    constructor(
        private logger?: (log: string, level?: 'trace' | 'debug' | 'info' | 'warn' | 'error', showPrefix?: boolean) => Promise<void> | void,
        private stopControl?: {
            sigal: () => Promise<boolean> | boolean
            callback: () => Promise<void> | void
        }
    ) {
        this.shell = spawn('bash');
        this.setupListeners();

        if (this.stopControl) {
            this.stopTimer = setInterval(async () => {
                if (await this.stopControl?.sigal()) {
                    this.isStop = true;
                    await this.stopControl?.callback();

                    if (this.stopTimer) {
                        clearInterval(this.stopTimer);
                        this.stopTimer = null;
                    }

                    if (this.timeoutTimer) {
                        clearInterval(this.timeoutTimer);
                        this.timeoutTimer = null;
                    }

                    this.close();
                }
            }, STOP_INTERVAL);
        }
    }

    private successMark() {
        return `__DONE_${Math.random().toString(36).toUpperCase()}__`;
    }

    private setupListeners() {
        const fn = async (data: Buffer) => {
            const chunk = data.toString();

            this.tailBuffer += chunk;

            if (this.delimiter && this.tailBuffer.includes(this.delimiter)) {
                const parts = this.tailBuffer.split(this.delimiter);
                const afterDelimiter = parts[1] || '';
                const isSuccess = afterDelimiter.trim().startsWith('0');

                if (!this.isStop && this.logger) {
                    await this.logger(chunk.split(this.delimiter)[0], undefined, false);
                }
                if (this.currentResolver) {
                    if (!this.isStop) {
                        this.currentResolver(isSuccess);
                    } else {
                        this.currentResolver(false);
                    }
                    this.currentResolver = null;
                }
                this.tailBuffer = '';
            } else {
                if (this.tailBuffer.length > MAX_TAIL_SIZE) {
                    this.tailBuffer = this.tailBuffer.slice(-MAX_TAIL_SIZE);
                }
                if (!this.isStop && this.logger) {
                    await this.logger(chunk, undefined, false);
                }
                if (this.isStop && this.currentResolver) {
                    this.currentResolver(false);
                    this.currentResolver = null;
                }
            }
        };

        this.shell?.stdout.on('data', fn);
        this.shell?.stderr.on('data', fn);
    }

    async exec(cmd: string, replace?: Record<string, string>): Promise<boolean> {
        if (this.isStop) {
            return false;
        }
        if (this.currentResolver) {
            // 上一个命令还未执行完毕
            if (this.logger) {
                await this.logger(`command [${cmd}] cannot be executed temporarily: the previous command has not yet finished executing.`, 'warn', true);
            }
            return false;
        }

        if (!this.shell) {
            return false;
        }

        if (this.logger) {
            await this.logger('--------------------- server command ---------------------', 'info', true);
            await this.logger(cmd, 'info', true);
            await this.logger('----------------------------------------------------------', 'info', true);
        }

        return await new Promise((resolve) => {
            this.currentResolver = resolve;
            this.delimiter = this.successMark();
            this.timeoutTimer = setTimeout(async () => {
                this.close();
                if (this.timeoutTimer !== null) {
                    clearTimeout(this.timeoutTimer);
                    this.timeoutTimer = null;

                    if (this.logger) {
                        await this.logger('command executed timeout ......\n', 'error', true);
                    }
                }
                if (this.currentResolver) {
                    this.currentResolver(false);
                    this.currentResolver = null;
                }
            }, LOCAL_COMMAND_RUN_TIMEOUT * 60 * 1000);

            let command = cmd;
            const _replace: Record<string, string> = replace || {};

            for (const rep in _replace) {
                if (command.includes(rep)) {
                    command = command.replace(rep, _replace[rep]);
                }
            }
            const currentPathCmd = 'echo [ local working path: $(pwd) ]';

            this.shell?.stdin.write(`${currentPathCmd} && ${command}\necho "${this.delimiter}$?"\n`);
        });
    }

    async hasCommand(command: string): Promise<boolean> {
        return new Promise((resolve) => {
            // command -v 会返回命令的路径，如果不存在则没有任何输出且退出码非 0
            exec(`command -v ${command}`, async (error: ExecException | null, stdout: string, stderr: string) => {
                const result = !error;

                if (this.logger) {
                    if (result) {
                        await this.logger(`command ${command} at: ${stdout || stderr}`, undefined, true);
                    } else {
                        await this.logger(`command ${command} not found. ${stdout || stderr}`, undefined, true);
                    }
                }
                resolve(result);
            });
        });
    }

    close() {
        this.shell?.stdin.end();
        this.shell?.kill();
        this.shell = null;
    }
}

// // 测试代码
// (async () => {
// 	let stopSignal = false;

// 	setTimeout(() => {
// 		stopSignal = true;
// 	}, 10 * 1000);

// 	const shell = new LocalShell(log => console.log(log), {
// 		sigal: () => stopSignal,
// 		callback: () => {
// 			console.log('本地执行被中断了');
// 		}
// 	});

// 	// 测试 1: 正常命令
// 	const res1 = await shell.exec('echo "Hello World"');
// 	console.log('Test 1:', res1 ? '✅ Success' : '❌ Failed', 'Output:', res1);

// 	// 测试 2: 错误命令（测试状态码获取）
// 	const res2 = await shell.exec('pwd');
// 	console.log('Test 2:', res2 ? '✅ Success' : '❌ Failed', 'Output:', res2);

// 	// 测试 3: 错误命令（测试状态码获取）
// 	const res3 = await shell.exec('cd test123');
// 	console.log('Test 3:', res3 ? '✅ Success' : '❌ Failed', 'Output:', res3);

// 	const res4 = await shell.exec('find / -name "test123"');
// 	console.log('Test 4:', res4 ? '✅ Success' : '❌ Failed', 'Output:', res4);

// 	const res5 = await shell.hasCommand('tree');
// 	console.log('Test 5:', res5);

// 	shell.close();
// })();

export class RemoteSSH {
    private ssh: Client | null = null;
    private excuting = false;
    private isStop = false;
    private stopTimer: NodeJS.Timeout | null = null;

    constructor(
        private device: { host: string, port: number, username: string, password: string },
        private logger?: (log: string, level?: 'trace' | 'debug' | 'info' | 'warn' | 'error', showPrefix?: boolean) => Promise<void> | void,
        private stopControl?: {
            sigal: () => Promise<boolean> | boolean
            callback: () => Promise<void> | void
        }
    ) {
        if (this.stopControl) {
            this.stopTimer = setInterval(async () => {
                if (await this.stopControl?.sigal()) {
                    this.isStop = true;
                    await this.stopControl?.callback();

                    if (this.stopTimer) {
                        clearInterval(this.stopTimer);
                        this.stopTimer = null;
                    }

                    this.close();
                }
            }, STOP_INTERVAL);
        }
    }

    private successMark() {
        return `__DONE_${Math.random().toString(36).toUpperCase()}__`;
    }

    get connected() {
        return !!this.ssh;
    }

    async connect() {
        const { host, port, username, password } = this.device;
        const deviceStr = `${username}@${host}:${port}`;

        await new Promise(resolve => setTimeout(resolve, 3 * 1000));
        if (!this.isStop && this.logger) {
            await this.logger(`connect remote device ${deviceStr}:`, 'debug');
        }

        for (let attempt = 1; attempt <= 10; attempt++) {
            if (this.isStop) {
                return;
            }
            const connnection: Client | null = await new Promise(resolve => {
                const conn = new Client();

                conn.once('error', async (error) => {
                    if (this.logger) {
                        await this.logger(`${error.message}..., will retry in 3s.`, 'warn');
                    }
                    conn.end();
                    conn.destroy();
                    resolve(null);
                });
                conn.once('timeout', async () => {
                    if (this.logger) {
                        await this.logger(`${deviceStr} connect timeout..., will retry in 3s.`, 'warn');
                    }
                    conn.end();
                    conn.destroy();
                    resolve(null);
                });
                conn.once('greeting', async message => {
                    if (this.logger) {
                        await this.logger(message);
                    }
                });
                conn.once('ready', async () => {
                    if (this.logger) {
                        await this.logger(`${deviceStr} connect success!\n`, 'info');
                    }
                    resolve(conn);
                });

                conn.connect({
                    host,
                    port: Number(port),
                    username,
                    password,
                    readyTimeout: 10 * 1000,
                    forceIPv4: true
                    // debug: (msg) => console.log('DEBUG:', msg)
                });
            });

            if (connnection) {
                this.ssh = connnection;
                return;
            }
            if (attempt < 10) {
                await new Promise(resolve => setTimeout(resolve, 3 * 1000));
            }
        }
        if (!this.isStop && this.logger) {
            await this.logger(`connect ${deviceStr} failed!\n`, 'error');
        }
    }

    async checkDirExist(dirPath: string): Promise<boolean> {
        return await new Promise(resolve => {
            if (!this.ssh) {
                return resolve(false);
            }
            this.ssh?.exec(`test ! -d "${dirPath}"`, async (err, stream) => {
                if (err) {
                    return resolve(false);
                }

                stream
                    .on('close', (code: number) => resolve(code !== 0))
                    .on('data', () => { })
                    .stderr.on('data', () => { });
            });
        });
    }

    async exec(command: string, option?: {
        showLog?: boolean
        workDir?: string
        exportCmd?: string
        checkSuccess?: boolean
    }): Promise<boolean> {
        const { workDir, exportCmd, checkSuccess, showLog = true } = option || {};

        if (!this.isStop && this.excuting && showLog && this.logger) {
            await this.logger(`command [${command}] cannot be executed temporarily: the previous command has not yet finished executing.`, 'warn');
        }
        const currentPathCmd = 'echo [ remote working path: $(pwd) ]';
        let _command = workDir ? `cd ${workDir} && ${currentPathCmd} && ${command}` : `${currentPathCmd} && ${command}`;

        if (exportCmd) {
            _command = `export ${exportCmd} && ${_command}`;
        }

        const randomStr = this.successMark();

        if (checkSuccess) {
            _command = `${_command} && echo "${randomStr}"`;
        }

        if (!this.isStop && showLog && this.logger) {
            await this.logger('--------------------- remote command ---------------------', 'info', true);
            await this.logger(command, 'info', true);
            await this.logger('----------------------------------------------------------', 'info', true);
        }

        return await new Promise(resolve => {
            if (!this.ssh) {
                return resolve(false);
            }
            this.excuting = true;
            this.ssh.exec(_command, async (err, stream) => {
                if (err) {
                    if (showLog && this.logger) {
                        await this.logger(err.message, 'error', false);
                    }
                    this.excuting = false;
                    return resolve(false);
                }

                let log = '';

                stream.on('close', async () => {
                    if (!this.isStop && showLog && this.logger) {
                        await this.logger('\n\n\n', undefined, false);
                    }
                    this.excuting = false;
                    stream.destroy();
                    if (checkSuccess) {
                        if (log.includes(randomStr)) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    } else {
                        resolve(true);
                    }
                }).on('data', async (data: Buffer) => {
                    if (this.isStop) {
                        resolve(false);
                    }
                    log = data.toString();
                    if (!this.isStop && showLog && this.logger) {
                        await this.logger(data.toString(), undefined, false);
                    }
                }).stderr.on('data', async data => {
                    if (this.isStop) {
                        resolve(false);
                    }
                    log = data.toString();
                    if (!this.isStop && showLog && this.logger) {
                        await this.logger(data.toString(), undefined, false);
                    }
                });
            });
        });
    }

    async hasCommand(command: string): Promise<boolean> {
        return await new Promise(resolve => {
            if (!this.ssh) {
                return resolve(false);
            }
            this.ssh.exec(`command -v ${command}`, (err, stream) => {
                if (err) {
                    throw err;
                }

                stream.on('close', async (code: number) => {
                    const result = (code === 0);

                    if (!result && this.logger) {
                        await this.logger(`command ${command} not found.`, undefined, false);
                    }
                }).on('data', async (data: Buffer) => {
                    // 如果存在，data 会输出命令的绝对路径，例如 /usr/bin/docker
                    if (this.logger) {
                        await this.logger(`${command} at: ${data.toString()}`, undefined, false);
                    }
                });
            });
        });
    }

    close() {
        this.ssh?.end();
        this.ssh?.destroy();
        this.ssh = null;
    }
}

// (async () => {
// 	let stopSignal = false;

// 	setTimeout(() => {
// 		stopSignal = true;
// 	}, 10 * 1000);

// 	const ssh = new RemoteSSH({
// 		host: '0.0.0.0',
// 		port: 22,
// 		username: 'xxx',
// 		password: ''
// 	}, log => console.log(log), {
// 		sigal: () => stopSignal,
// 		callback: () => {
// 			console.log('远程执行被中断了');
// 		}
// 	});

// 	await ssh.connect();
// 	const res1 = await ssh.exec('ls ~', { checkSuccess: true });

// 	console.log('test 1', res1);
// 	const res2 = await ssh.exec('ls testaaa', { checkSuccess: true });

// 	console.log('test 2', res2);
// 	const res3 = await ssh.exec('find / -name "testaaa"', { checkSuccess: true });

// 	console.log('test 3', res3);

// 	const res4 = await ssh.hasCommand('tree');

// 	console.log('test 4', res4);

// 	ssh.close();
// })();
