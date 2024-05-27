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
	departmentId?: string
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

interface AddressbookRuleModel {
	_id: string
	name: string
	/** 是否对所有人/部门隐藏，若为true，则下面所有的设置都将被忽略 */
	hiddenToAll: boolean
	/** 是否仅可见自己所在部门(及以下)的组织架构，仅为true时对目标数据起作用 */
	visibleToSelfOrg: boolean
	/** 要设置可见性的人 */
	targetUserIds: Array<string>
	/** 要设置可见性的部门 */
	targetDepartmentIds: Array<string>
	/** 对哪些人不可见 */
	hiddenUserIds: Array<string>
	/** 对哪些人可见 */
	visibleUserIds: Array<string>
	/** 对哪些部门不可见 */
	hiddenDepartmentIds: Array<string>
	/** 对哪些部门可见 */
	visibleDepartmentIds: Array<string>
}

type progressConfigParams = 'NODE_ENV' | 'SERVER_NAME' | 'TRACE_LOG_LEVEL' | 'DEV_LOG_LEVEL' | 'AUDIT_LOG_LEVEL' | 'JWT_APP_NAME' | 'JWT_APP_ID' | 'JWT_APP_SECERT' | 'REDIS_URL' |
	'MONGO_URL'


interface TestTaskData {
	_id: string
	createdAt: Date
	updatedAt: Date
	type: 'remote-ssh-task-data'
	data: {
		name: string
		device: {
			host: string
			port: number
			username: string
			password: string
		}
		commands: Array<string>
	}
}

interface TestTaskRecord {
	_id: string
	createdAt: Date
	updatedAt: Date
	type: 'remote-ssh-task-record'
	data: {
		status: 'waiting' | 'handling' | 'running' | 'stoped' | 'finished'
		taskId: string
		result: string
		instance?: string
	}
}

type TestModel = TestTaskData | TestTaskRecord
