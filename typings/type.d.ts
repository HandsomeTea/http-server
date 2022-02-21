declare interface httpArgument {
    params?: Record<string, any>;
    data?: Record<string, unknown>;
    headers?: Record<string, string | string[] | undefined>
}

declare interface InstanceException {
    message: string;
    source: Array<string>;
    code: string;
    status: number;
    reason?: Array<string>;
}

declare interface ExceptionConstructor {
    new(messageOrErrorOrException: string | InstanceException | Error, code?: string, reason?: Array<string>): InstanceException;
    readonly prototype: InstanceException;
}

declare const Exception: ExceptionConstructor;

type SocketMethod = 'login'

type DeviceType = 'BCD' | 'BCM' | 'H323_SIP'
type DeviceModel = 'WINDOWS' | 'MAC' | 'UOS' | 'H323_SIP' | 'ANDROID' | 'IOS'

type DBServerType = 'mongodb' | 'mysql';

declare interface Device {
    serialNumber: string
    deviceType: DeviceType
    model: DeviceModel
    OSVersion: string
    softVersion: string
    extend: {
        deviceName: string
        extension: string
    }
}

declare interface SocketAttempt {
    connection: {
        id: string
        ip: string
        device?: Device
    }
    userId?: string
    form?: SocketLoginForm
    type?: SocketLoginType
    SN?: string
    userTenantId?: string
    stampedLoginToken?: {
        token: string
        when: Date
    }
}

declare namespace Express {
    interface Response {
        success: (result?: unknown) => void
    }

    interface Request {

    }
}
