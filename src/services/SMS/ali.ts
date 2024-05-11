import aliSMS from 'ali-sms';
import { randomString } from '@/utils';
import { isPhone } from '@coco-sheng/js-tools';
import { log, ErrorCode } from '@/configs';
// import redisService from './redisService';
// import vendorTempService from './vendorCredentialTokenService';


export const AliSMS = new class SMS {
	constructor() {
		//
	}

	private async getSMSConfig() {
		const { smsId, smsSecret, smsSign, smsCodeTempleteId } = eval('');//await redisService.getServiceGroupConfig();

		if (!smsId || !smsSecret || !smsSign || !smsCodeTempleteId) {
			throw new Exception('smsId, smsSecret, smsSign and smsCodeTempleteId is required in service group config', ErrorCode.INVALID_ARGUMENTS);
		}
		return { smsId, smsSecret, smsSign, smsCodeTempleteId };
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private async sendMessage(phone: string, variableObj: Record<string, any>, accessKeyID: string, accessKeySecret: string, signName: string, SMSTempleteId: string) {
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

		const { smsId, smsSecret, smsSign, smsCodeTempleteId } = await this.getSMSConfig();

		try {
			const code = randomString(6, '23456789ABCDEFGHJKLMNPQRSTWXYZ');

			await this.sendMessage(phone, { code }, smsId, smsSecret, smsSign, smsCodeTempleteId);
			log('SMS').debug(`tenantId is ${tenantId}`);
			// await vendorTempService.storeSendSMSCodeCredential(code.toLowerCase(), detailType, { username, userId, phone, tenantId });
		} catch (e) {
			log('SMS-ali').error(e);
			throw new Exception('send sms code failed by Aliyun SMS service.', ErrorCode.INVALID_SMS_SERVER_CONFIG);
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
