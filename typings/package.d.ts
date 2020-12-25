declare module 'ali-sms' {
    import aliSms from 'ali-sms';

    interface aliSMSConfig {
        accessKeyID: string
        accessKeySecret: string
        paramString: Record<string, any>
        recNum: Array<string>
        signName: string
        templateCode: string
    }

    export default (config: aliSMSConfig, callback: (error?: any, body?: any) => void) => aliSms(config, callback);
}
