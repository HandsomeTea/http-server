import { sms } from 'tencentcloud-sdk-nodejs';
import { getPhone } from '@coco-sheng/js-tools';
import { ErrorCode, getENV } from '@/configs';
import { randomString } from '@/utils';


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
		const result = list.DescribeTemplateStatusSet?.find(a => a.TemplateName === type);

		if (!result) {
			throw new Exception(`tencent sms template: ${type} is not found.`);
		}
		return result;
	}

	private async getSignName() {
		const { DescribeSignListStatusSet } = await this.service.DescribeSmsSignList({
			SignIdSet: [parseInt(this.signId)],
			International: 0
		});

		if (DescribeSignListStatusSet && DescribeSignListStatusSet.length > 0) {
			return DescribeSignListStatusSet[0].SignName;
		}
		return '海湃领客';
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	async sendMessage(phone: string, smsTemplatetype: TencentSmsType, variable: Array<string>) {
		const result = await this.service.SendSms({
			PhoneNumberSet: [`+86${phone}`],
			SmsSdkAppId: this.appId,
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
