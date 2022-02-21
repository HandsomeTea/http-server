interface UserModel {
    _id: string
    name: string
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

type ServiceGroupConfigKey = 'conferenceToken'

interface ServiceGroupConfigModel {
    _id: ServiceGroupConfigKey
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    value: string
}

type TenantConfigKey = 'passwordCustomLength' | 'passwordNumberLength' | 'passwordLowercaseLength' | 'passwordCapitalLength' | 'passwordSpecialCharacterLength' | 'passwordUpdateInterval'

interface TenantGroupConfigModel {
    _id: TenantConfigKey
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    value: string
    module: 'password'
}

interface SocketSession {
    id: string
    hashedToken: string
    instanceId: string
    status: 'online' | 'offline'
    type: 'guest' | 'system-user'
    tenantId: string
    device: {
        OSVersion: string
        deviceType: DeviceType
        model: DeviceModel
        serialNumber: string
        softVersion: string
        tenantId: string
    }
    _createdAt: Date
    _updatedAt: Date
}

interface SessionModel {
    _id: string
    connections: Array<SocketSession>
}

type progressConfigParams = 'NODE_ENV' | 'SERVER_NAME' | 'TRACE_LOG_LEVEL' | 'DEV_LOG_LEVEL' | 'AUDIT_LOG_LEVEL' | 'JWT_APP_NAME' | 'JWT_APP_ID' | 'JWT_APP_SECERT' | 'REDIS_URL' |
    'MONGO_URL'
