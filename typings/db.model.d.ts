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

type progressConfigParams = 'NODE_ENV' | 'SERVER_NAME' | 'TRACE_LOG_LEVEL' | 'DEV_LOG_LEVEL' | 'AUDIT_LOG_LEVEL' | 'JWT_APP_NAME' | 'JWT_APP_ID' | 'JWT_APP_SECERT' | 'REDIS_URL' |
    'MONGO_URL'
