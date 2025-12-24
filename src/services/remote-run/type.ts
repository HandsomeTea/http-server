// interface MongoField {
//     _id: string
//     createdAt: Date
//     updatedAt: Date
// }

// type InstanceModel = MongoField & {
//     instance: string
//     type: 'bundle'
// }


// type BundleModel = MongoField & {
//     taskId: string
//     type: 'model_deploy' | 'model_benchmark'
//     data: {
//         env: Record<string, string | number>
//     }
//     status: 'pending' | 'running' | 'finished' | 'error'
//     user: string
// }

// type ReomteRunModel = MongoField & {
//     name: string
//     cmds: Array<string>
//     files: Array<{
//         address: string
//         path: string
//         type: 'file' | 'dir'
//         envKey?: string
//     }>
//     device: {
//         tag?: string
//         features?: Array<string>
//         id?: string
//     }
//     artifacts: Array<{ path: string, addr: string }>
//     status: 'pending' | 'running' | 'finished' | 'error'
//     log: {
//         has: boolean
//         addr?: string
//     }
//     bundleId: string
//     previous?: string
//     user: string
//     instance: string
// }
