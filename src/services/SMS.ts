import aliSMS from 'ali-sms';
import { sms } from 'tencentcloud-sdk-nodejs';
import { randomString } from '@/utils';
import { isPhone, getPhone } from '@coco-sheng/js-tools';
import { log, ErrorCode, getENV } from '@/configs';
// import redisService from './redisService';
// import vendorTempService from './vendorCredentialTokenService';
type SmsCodeType = 'login-phone-code' | 'admin-login-phone-code';
interface SmsService {
    isUseful: boolean
    sendMessage: (phone: string, smsTemplatetype: string, variable: Array<string>) => void
}

type TencentSmsType = 'common-verification-code' | 'productimage-task-notice';

const TencentSmsServer = new class TencentSMS implements SmsService {
    constructor() {
        //
    }

    get isUseful() {
        return Boolean(this.appId && this.secretId && this.secretKey);
    }

    private get secretKey() {
        return getENV('TENCENT_SMS_SECRET_KEY');
    }

    private get secretId() {
        return getENV('TENCENT_SMS_SECRET_ID');
    }

    private get appId() {
        return getENV('TENCENT_SMS_APP_ID');
    }

    private get signId() {
        return getENV('TENCENT_SMS_SIGN_ID');
    }

    private get service() {
        return new sms.v20210111.Client({
            credential: {
                secretId: this.secretId,
                secretKey: this.secretKey
            },
            region: 'ap-beijing',
            profile: {
                signMethod: 'TC3-HMAC-SHA256'
            }
        });
    }

    private async getTemplate(type: TencentSmsType) {
        const list = await this.service.DescribeSmsTemplateList({
            International: 0
        });
        const result = list.DescribeTemplateStatusSet.find(a => a.TemplateName === type);

        if (!result) {
            throw new Exception(`tencent sms template: ${type} is not found.`);
        }
        return result;
    }

    private async getSignName() {
        const { DescribeSignListStatusSet } = await this.service.DescribeSmsSignList({
            SignIdSet: [parseInt(this.signId as string)],
            International: 0
        });

        return DescribeSignListStatusSet[0].SignName || '海湃领客';
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    async sendMessage(phone: string, smsTemplatetype: TencentSmsType, variable: Array<string>) {
        const result = await this.service.SendSms({
            PhoneNumberSet: [`+86${phone}`],
            SmsSdkAppId: this.appId as string,
            TemplateId: `${(await this.getTemplate(smsTemplatetype)).TemplateId}`,
            SignName: await this.getSignName(),
            TemplateParamSet: variable
        });

        if (!result.SendStatusSet) {
            throw new Exception(`send to phone:${phone} error，please check your config. \n ${JSON.stringify(result, null, '   ')}`);
        }

        if (result.SendStatusSet[0].Code !== 'Ok') {
            if (result.SendStatusSet[0].Code !== 'LimitExceeded.PhoneNumberDailyLimit') {
                throw new Exception(`send to phone:${phone} error: The number of text messages sent by your mobile phone number exceeds the set upper limit`, ErrorCode.PHONE_MESSAGE_OUT_OF_LIMIT);
            }
            throw new Exception(`send to phone:${phone} error: \n ${JSON.stringify(result.SendStatusSet[0], null, '   ')}`);
        }
    }
};

export const TencentSMS = new class SMS {
    constructor() {
        //
    }

    private get service() {
        if (TencentSmsServer.isUseful) {
            return TencentSmsServer;
        }
        throw new Exception('there is no SMS service to send message.');
    }

    async sendCode(phone: string, type: SmsCodeType) {
        if (!new Set(['login-phone-code', 'admin-login-phone-code']).has(type)) {
            throw new Exception(`invalid send type ${type}`, ErrorCode.INVALID_ARGUMENTS);
        }
        const phoneNumber = getPhone(phone);

        if (!phoneNumber) {
            throw new Exception(`invalid phone number ${JSON.stringify(phone)}`, ErrorCode.INVALID_PHONE);
        }
        const code = randomString(6, '1234567890');

        await this.service.sendMessage(phoneNumber, 'common-verification-code', [code]);
        // await TempCredentialTokenService.storeSendSMSCodeCredential(code, type, {
        //     phone: phoneNumber,
        //     appId: httpContext.get('appId'),
        //     companyId: httpContext.get('companyId')
        // });
    }
};


export const AliSMS = new class SMS {
    private supportType: Set<string>;

    constructor() {
        this.supportType = new Set(['Aliyun']);
    }

    private async getSMSConfig() {
        const { smsPlatform, smsId, smsSecret, smsSign, smsCodeTempleteId } = eval('');//await redisService.getServiceGroupConfig();

        if (!smsPlatform || !smsId || !smsSecret || !smsSign || !smsCodeTempleteId) {
            throw new Exception('smsPlatform, smsId, smsSecret, smsSign and smsCodeTempleteId is required in service group config', ErrorCode.INVALID_ARGUMENTS);
        }
        return { smsPlatform, smsId, smsSecret, smsSign, smsCodeTempleteId };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async sendMessageByAli(phone: string, variableObj: Record<string, any>, accessKeyID: string, accessKeySecret: string, signName: string, SMSTempleteId: string) {
        const notices = {
            accessKeyID,
            accessKeySecret,
            paramString: variableObj,
            recNum: [`${phone}`],
            signName,
            templateCode: SMSTempleteId
        };

        return new Promise((resolve, reject) => {
            aliSMS(notices, (err, body) => {
                if (err) {
                    log('SMS-ali').error(err);
                    return reject(err);
                }
                try {
                    const result = JSON.parse(body);

                    if (result.Message === 'OK') {
                        log('SMS-ali').debug(result);
                        return resolve(result);
                    } else {
                        return reject(result);
                    }
                } catch (e) {
                    log('SMS-ali').error(e);
                    return reject(e);
                }
            });
        });
    }

    /**
     * 发送短信验证码
     */
    private async sendSMSCode(phone: string, detailType: 'forget-pwd-code' | 'register-user-code' | 'verify-phone-code', tenantId: string, username?: string, userId?: string) {
        if (!isPhone(phone) || !detailType || !username && !userId) {
            throw new Exception('phone, username or userId, detailType is required.', ErrorCode.INVALID_ARGUMENTS);
        }

        const { smsPlatform, smsId, smsSecret, smsSign, smsCodeTempleteId } = await this.getSMSConfig();

        if (this.supportType.has(smsPlatform) && smsPlatform === 'Aliyun') {
            try {
                const code = randomString(6, '23456789ABCDEFGHJKLMNPQRSTWXYZ');

                await this.sendMessageByAli(phone, { code }, smsId, smsSecret, smsSign, smsCodeTempleteId);
                log('SMS').debug(`tenantId is ${tenantId}`);
                // await vendorTempService.storeSendSMSCodeCredential(code.toLowerCase(), detailType, { username, userId, phone, tenantId });
            } catch (e) {
                log('SMS-ali').error(e);
                throw new Exception('send sms code failed by Aliyun SMS service.', ErrorCode.INVALID_SMS_SERVER_CONFIG);
            }
        } else {
            log('SMS').error(`do not support sms type of ${smsPlatform}`);
            throw new Exception(`do not support sms type of ${smsPlatform}`, ErrorCode.INVALID_SMS_SERVER_CONFIG);
        }
    }

    /**
     * 发送忘记密码的验证码
     */
    async sendForgetPasswordSMSCode(phone: string, username: string, tenantId: string) {
        return await this.sendSMSCode(phone, 'forget-pwd-code', tenantId, username);
    }

    /**
     * 发送注册用户时的验证码
     */
    async sendRegisterSMSCode(phone: string, username: string, tenantId: string) {
        return await this.sendSMSCode(phone, 'register-user-code', tenantId, username);
    }

    /**发送验证手机号码的验证码 */
    async sendVerifyPhoneSMSCode(phone: string, userId: string, tenantId: string) {
        return await this.sendSMSCode(phone, 'verify-phone-code', tenantId, undefined, userId);
    }
};
