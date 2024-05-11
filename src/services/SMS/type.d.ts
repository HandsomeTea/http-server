interface SmsService {
	isUseful: boolean
	sendMessage: (phone: string, smsTemplatetype: string, variable: Array<string>) => void
}

type SmsCodeType = 'login-phone-code' | 'admin-login-phone-code';
