// import { Bundles, RemoteRuns } from '@/models';
// import RemoteRunService from './remote-run';

// export default new class BundleService {
//     async createTask(task: {
//         taskId: string
//         taskType: BundleModel['type']
//         env: Record<string, string | number>
//         files: Array<{
//             type: 'file' | 'dir'
//             address: string
//             path: string
//             envKey?: string
//         }>
//         commands: Array<{
//             name: string
//             cmds: Array<string>
//             device: {
//                 id?: string
//                 tag?: string
//                 features?: Array<string>
//             }
//             artifacts: Array<string>
//         }>
//     }, user: string) {
//         const { taskId, taskType, env, files, commands } = task;
//         const bundle = await Bundles.insertOne({
//             taskId,
//             type: taskType,
//             data: { env },
//             user,
//             status: 'pending'
//         });
//         let previous = '';

//         for (const command of commands) {
//             const commandEnv = command.cmds.toString().match(/(\$([A-Za-z_][A-Za-z0-9_]*))|(\$\{(\s){0,}([A-Za-z_][A-Za-z0-9_]*)(\s){0,}\})/g);
//             const remoteRunFiles: ReomteRunModel['files'] = [];

//             if (commandEnv && commandEnv.length > 0) {
//                 for (const _env of commandEnv) {
//                     const envKey = _env.replace('{', '').replace('}', '').replace('$', '').trim();
//                     const file = files.find(f => f.envKey === envKey);

//                     if (file) {
//                         remoteRunFiles.push({
//                             address: file.address,
//                             path: file.path,
//                             type: file.type,
//                             envKey: file.envKey
//                         });
//                     }
//                 }
//             }

//             const remoteRun = await RemoteRunService.createRemoteRun({
//                 name: command.name,
//                 cmds: command.cmds,
//                 device: command.device,
//                 previous,
//                 user,
//                 artifacts: [...new Set(command.artifacts.map(s => s.trim()))].map(a => ({ path: a, addr: '' })),
//                 files: remoteRunFiles
//             }, bundle._id.toString());

//             previous = remoteRun._id.toString();
//         }

//         this.runBundle(bundle._id.toString(), env);
//     }

//     async runBundle(bundleId: string, env?: Record<string, string | number>) {
//         if (!env) {
//             env = (await Bundles.findById(bundleId))?.data.env || {};
//         }
//         await this.setBundleStatus(bundleId, 'running');

//         let previousRemoteRunId = '';
//         const loop = async () => {
//             const remoteRun = await RemoteRuns.findOne({ bundleId, previous: previousRemoteRunId });

//             if (!remoteRun || remoteRun.status === 'error' || remoteRun.status === 'running') {
//                 return;
//             }
//             const remoteRunId = remoteRun._id.toString();

//             if (remoteRun.status === 'finished') {
//                 previousRemoteRunId = remoteRunId;
//                 return await loop();
//             }
//             const isSuccess = await RemoteRunService.run(remoteRunId, remoteRun.device, {
//                 cmds: remoteRun.cmds,
//                 artifacts: remoteRun.artifacts.map(a => a.path),
//                 env,
//                 files: remoteRun.files
//             });

//             if (!isSuccess) {
//                 await RemoteRunService.setRemoteRunStatus(remoteRunId, 'error');
//                 await this.setBundleStatus(bundleId, 'error');
//                 return;
//             }
//             await RemoteRunService.setRemoteRunStatus(remoteRunId, 'finished');

//             previousRemoteRunId = remoteRunId;
//             await loop();
//         };

//         await loop();
//         await this.setBundleStatus(bundleId, 'finished');
//     }

//     async setBundleStatus(_id: string, status: BundleModel['status']) {
//         await Bundles.updateOne({ _id }, { status });
//     }
// };
