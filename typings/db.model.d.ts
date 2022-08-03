interface HashedTokenData {
    when: Date
    hashedToken: string
    token?: string
}

interface UserModel {
    _id: string
    name: string
    // service: {
    //     password: string,
    //     resume?: Array<HashedTokenData>
    // }
    // arr: Array<string>
    test?: string
    createdAt?: Date
    _updatedAt?: Date
}

interface InstanceModel {
    _id: string
    instance: string
    createdAt: Date
    _updatedAt: Date
}

type ScheduledType = 'zwwechat_org_sync_config'
type ScheduledTaskType = 'zwwechat_org_sync'

interface ScheduledModel {
    _id: ScheduledType
    tenantId: string
    name?: string
    startTime: Date
    endTime?: Date
    /** 每次执行时间，几点几分，如果cycleUnit是小时，则表示几分 */
    hitTime: string
    /** 执行间隔，每几小时/几天/几月 */
    cycle: number
    /** 间隔单位 */
    cycleUnit: 'hour' | 'day' | 'week'
}

interface ScheduledTaskModel {
    _id: string
    /** 所属定时任务 */
    belongId: ScheduledType
    tenantId: string
    /** 当前任务执行时间 */
    hitTime: Date
    /** 当前任务标识 */
    type: ScheduledTaskType
}

type progressConfigParams = 'NODE_ENV' | 'SERVER_NAME' | 'TRACE_LOG_LEVEL' | 'DEV_LOG_LEVEL' | 'AUDIT_LOG_LEVEL' | 'JWT_APP_NAME' | 'JWT_APP_ID' | 'JWT_APP_SECERT' | 'REDIS_URL' |
    'MONGO_URL'
