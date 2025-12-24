// import { Client, ConnectConfig } from 'ssh2';
// import path from 'path';
// import fs from 'fs';
// import redisService from './redis';
// import { HTTP } from './HTTP';
// import { deleteFolder, randomString } from '@/utils';
// import { RemoteRuns } from '@/models';

// export default new class RemoteRunService {
//     private getMarker(remoteRunId: string) {
//         return `bundle-remote-run:${remoteRunId}`;
//     }

//     async setRemoteRunStatus(_id: string, status: ReomteRunModel['status']) {
//         await RemoteRuns.updateOne({ _id }, { $set: { status } });
//     }

//     async createRemoteRun(
//         data: {
//             name: string,
//             cmds: Array<string>,
//             files: Array<{ address: string, path: string, type: 'file' | 'dir', envKey?: string }>
//             device: {
//                 tag?: string
//                 features?: Array<string>
//                 id?: string
//             }
//             artifacts: Array<{ path: string, addr: string }>
//             previous: string
//             user: string
//         },
//         bundleId: string
//     ) {
//         const { name, cmds, files, device, artifacts, previous, user } = data;

//         return await RemoteRuns.insertOne({
//             name,
//             cmds,
//             files,
//             device,
//             artifacts,
//             status: 'pending',
//             log: {
//                 has: false
//             },
//             bundleId,
//             previous,
//             user,
//             instance: process.env.INSTANCEID as string
//         });
//     }

//     async setRemoteRunLog(remoteRunId: string, has: boolean, logAddr?: string) {
//         await RemoteRuns.updateOne({ _id: remoteRunId }, {
//             $set: {
//                 'log.has': has,
//                 'log.addr': logAddr || ''
//             }
//         });
//     }

//     async run(remoteRunId: string, device: { tag?: string, features?: Array<string>, id?: string }, params: {
//         cmds: Array<string>
//         artifacts: Array<string>
//         env: Record<string, string | number>
//         files: ReomteRunModel['files']
//     }) {
//         const marker = this.getMarker(remoteRunId);

//         await redisService.clearRemoteRunLog(marker);
//         const deviceData = await HTTP.applyDevice(device);
//         let hasLog = false;

//         // ?
//         if (!deviceData.device) {
//             await redisService.publishRemoteRunLog(marker, `apply device error: ${deviceData.message}`, 'error');
//             await this.setRemoteRunLog(remoteRunId, true);

//             hasLog = true;
//             await this.saveRemoteRunLog(remoteRunId, marker);
//             return false;
//         }
//         const deviceConfig: ConnectConfig = {
//             host: deviceData.device.host,
//             port: deviceData.device.port,
//             username: deviceData.device.username,
//             password: deviceData.device.password
//         };
//         const connection = await this.connectDevice(marker, deviceConfig) as Client | null;

//         if (!hasLog) {
//             await this.setRemoteRunLog(remoteRunId, true);
//         }

//         if (!connection) {
//             await this.saveRemoteRunLog(remoteRunId, marker);
//             return false;
//         }
//         await this.setRemoteRunStatus(remoteRunId, 'running');

//         const { cmds, artifacts, files, env } = params;
//         // ?
//         const deviceTempWorkDir = path.join(__dirname, `../../temp/${randomString()}`);

//         await redisService.publishRemoteRunLog(marker, '------------------------------', 'info');

//         if (Object.keys(env).length > 0) {
//             await redisService.publishRemoteRunLog(marker, 'run with env:', 'info');
//         }

//         for (const key in env) {
//             if (typeof env[key] === 'string') {
//                 await redisService.publishRemoteRunLog(marker, `		$${key}: "${env[key]}"`, 'debug');
//             } else {
//                 await redisService.publishRemoteRunLog(marker, `		$${key}: ${env[key]}`, 'debug');
//             }
//         }

//         if (files.length > 0) {
//             await redisService.publishRemoteRunLog(marker, 'run ues files:', 'info');
//         }

//         for (const file of files) {
//             const filePath = path.join(deviceTempWorkDir, file.path);

//             await redisService.publishRemoteRunLog(marker, `		${filePath.replace(`${deviceTempWorkDir}/`, '')}`, 'debug');
//         }
//         await redisService.publishRemoteRunLog(marker, '------------------------------', 'info');

//         const isCreateWorkDir = await this.executeCmd(connection, `mkdir -p ${deviceTempWorkDir}`);

//         if (!isCreateWorkDir) {
//             await this.saveRemoteRunLog(remoteRunId, marker);
//             return false;
//         }
//         await redisService.publishRemoteRunLog(marker, `work dir ${deviceTempWorkDir} prepared!`, 'info');

//         const isPrepared = await this.prepareRemoteRunFiles(connection, marker, deviceTempWorkDir, files);

//         if (!isPrepared) {
//             await this.saveRemoteRunLog(remoteRunId, marker);
//             return false;
//         }

//         for (const cmd of cmds) {
//             const isSuccess = await this.executeCmd(connection, cmd, {
//                 marker,
//                 workDir: deviceTempWorkDir,
//                 exportCmd: `${Object.keys(env).map(a => {
//                     if (typeof env[a] === 'string') {
//                         return `${a}="${env[a]}"`;
//                     } else {
//                         return `${a}=${env[a]}`;
//                     }
//                 }).join(' ')}` +
//                     ' ' +
//                     files.filter(s => !!s.envKey).map(a => `${a.envKey}="${a.path}"`).join(' ')
//             });

//             if (!isSuccess) {
//                 await this.saveRemoteRunLog(remoteRunId, marker);
//                 return false;
//             }
//         }

//         if (artifacts.length === 0) {
//             await redisService.publishRemoteRunLog(marker, 'This command doesn\'t define any artifacts; whether it will have any impact on the overall business logic after execution remains to be seen.', 'warning');
//         } else {
//             const isUpload = await this.uploadRemoteRunArtifacts(connection, marker, deviceTempWorkDir, artifacts);

//             if (!isUpload) {
//                 await this.saveRemoteRunLog(remoteRunId, marker);
//                 return false;
//             }
//         }

//         await this.executeCmd(connection, `rm -rf ${deviceTempWorkDir}`);
//         await this.saveRemoteRunLog(remoteRunId, marker);
//         return true;
//     }

//     private async connectDevice(marker: string, deviceConfig: ConnectConfig): Promise<Client | null> {
//         return await new Promise(resolve => {
//             const conn = new Client();

//             conn.connect(deviceConfig)
//                 .on('error', async (error) => {
//                     await redisService.publishRemoteRunLog(marker, error.message, 'error');
//                     resolve(null);
//                 }).on('timeout', async () => {
//                     await redisService.publishRemoteRunLog(marker, `device ${deviceConfig.host} connect timeout`, 'error');
//                     resolve(null);
//                 }).on('greeting', async message => {
//                     await redisService.publishRemoteRunLog(marker, message);
//                 }).on('ready', async () => {
//                     await redisService.publishRemoteRunLog(marker, `device ${deviceConfig.host} connect success!`, 'info');
//                     resolve(conn);
//                 });
//         });
//     }

//     private async executeCmd(connection: Client, cmd: string, option?: {
//         workDir?: string,
//         marker?: string,
//         exportCmd?: string
//     }): Promise<boolean> {
//         const { workDir, marker, exportCmd } = option || {};
//         let command = workDir ? `cd ${workDir} && ${cmd}` : cmd;

//         if (exportCmd) {
//             command = `export ${exportCmd} && ${command}`;
//         }

//         if (marker) {
//             await redisService.publishRemoteRunLog(marker, '\n');
//             await redisService.publishRemoteRunLog(marker, '==============================', 'info');
//             await redisService.publishRemoteRunLog(marker, `command: ${cmd}`, 'info');
//             await redisService.publishRemoteRunLog(marker, '==============================', 'info');
//         }
//         return await new Promise(resolve => {
//             connection.exec(command, async (err, stream) => {
//                 if (err) {
//                     if (marker) {
//                         await redisService.publishRemoteRunLog(marker, err.message, 'error');
//                     }
//                     return resolve(false);
//                 }

//                 stream.on('close', async () => {
//                     resolve(true);
//                 }).on('data', async (data: Buffer) => {
//                     if (marker) {
//                         await redisService.publishRemoteRunLog(marker, data.toString());
//                     }
//                 }).stderr.on('data', async data => {
//                     if (marker) {
//                         await redisService.publishRemoteRunLog(marker, data.toString());
//                     }
//                 });
//             });
//         });
//     }

//     private async prepareRemoteRunFiles(connection: Client, marker: string, workDir: string, files: ReomteRunModel['files']): Promise<boolean> {
//         return true;
//     }

//     private async uploadRemoteRunArtifacts(connection: Client, marker: string, workDir: string, artifacts: Array<string>): Promise<boolean> {
//         return true;
//     }

//     private async saveRemoteRunLog(rumoteRunId: string, marker: string) {
//         const logTempPath = path.join(__dirname, `../../temp/${randomString()}`, `remote-run-${rumoteRunId}.log`);

//         fs.mkdirSync(path.dirname(logTempPath), { recursive: true });
//         await redisService.saveBundleLogToFile(marker, logTempPath);

//         console.log(`log at: ${logTempPath}`);
//         // const logAddr = await OSS.uploadFile(logTempPath);

//         // ? 保存日志地址
//         await this.setRemoteRunLog(rumoteRunId, true, '');
//         deleteFolder(path.dirname(logTempPath));
//     }
// };
