import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
// import fs from 'fs';
// import ejs from 'ejs';
// import path from 'path';

import { log, errorType, getENV } from '@/configs';
import { randomString, isURL } from '@/utils';
// import vendorTempService from './vendorCredentialTokenService';
// import redisService from './redisService';

class Email {
    private service: null | Transporter<SMTPTransport.SentMessageInfo>;
    private host: null | string;
    private port: null | number;
    private authUser: null | string;
    private authPwd: null | string;
    private isTls: null | boolean;
    private writer: null | string;
    constructor() {
        this.service = null;
        this.host = null;
        this.port = null;
        this.authUser = null;
        this.authPwd = null;
        this.isTls = null;
        this.writer = null;
    }

    private async updateServer() {
        if (getENV('NODE_ENV') === 'development') {
            log('email-service').debug('email service use a test account.');
            const testAccount = await nodemailer.createTestAccount();

            this.host = 'smtp.ethereal.email';
            this.port = 587;
            this.authUser = testAccount.user;
            this.authPwd = testAccount.pass;
            this.isTls = false;
            this.writer = testAccount.user;
        } else {
            // const { smtpServerAddr, smtpServerPort, smtpUser, smtpPassword, smtpEnableTLS, smtpFromMail } = await redisService.getServiceGroupConfig();

            // this.host = smtpServerAddr;
            // this.port = parseInt(smtpServerPort);
            // this.authUser = smtpUser;
            // this.authPwd = smtpPassword;
            // this.isTls = eval(smtpEnableTLS);
            // this.writer = smtpFromMail;
        }

        log('get-email-config-result').debug({ host: this.host, port: this.port, authUser: this.authUser, authPwd: this.authPwd, isTls: this.isTls, writer: this.writer });

        this.service = nodemailer.createTransport({
            // host: this.host,
            // port: this.port,
            // secure: Boolean(this.isTls), // 是否使用TLS，true，端口为465，否则其他或者568
            // auth: {
            //     user: this.authUser,
            //     pass: this.authPwd
            // }
        });
    }

    private async testEmailService(): Promise<true | void> {
        try {
            if (await this.service?.verify()) {
                log('email-service-status').debug('email service is normal.');
                return true;
            }
        } catch (e) {
            log('email-service-status').error('email service is unavailable.');
            log('email-service-status').error(e);
        }
    }

    /**
     * 发送邮件
     *
     * @param {string} to 接受者的邮箱地址
     * @param {string} subject 邮箱主题
     * @param {string} html 邮箱内容，html字符串
     * @returns
     * @memberof Email
     */
    private async send(to: string, subject: string, html: string): Promise<SMTPTransport.SentMessageInfo | undefined> {
        await this.updateServer();

        if (await this.testEmailService()) {
            try {
                return await this.service?.sendMail({ from: `超视云 <${this.writer}>`, to, subject, html });
            } catch (e) {
                log('send-email').error(e);
                throw new Exception(`email send field to ${to}. maybe the email service is not configured correctly.`, errorType.INVALID_EMAIL_SERVER_CONFIG);
            }
        }
        return;
    }

    /**
     * 发送邮箱验证码
     *
     * @param {string} address 接受验证码的邮箱地址
     * @param {string} username 发送此次验证码的用户名
     * @param {'forget-pwd-code'|'register-user-code'} detailType 该验证码的用途，目前的值有forget-pwd-code，register-user-code
     * @param {string} tenantId tenantId
     * @memberof Email
     */
    private async sendEmailCode(address: string/*, username: string, detailType: 'forget-pwd-code' | 'register-user-code', tenantId: string*/) {
        // const templete = fs.readFileSync(path.resolve(__dirname, '../../assets/emailCode.ejs')).toString();
        const code = randomString(6, '23456789ABCDEFGHJKLMNPQRSTWXYZ');
        // const sendResult = await this.send(address, '超视云-邮箱验证码', ejs.render(templete, { code, type: detailType, title: '超视云-邮箱验证码' }));
        const sendResult = await this.send(address, '超视云-邮箱验证码', 'html字符串');

        if (!sendResult) {
            return;
        }
        log('send-forget-password-email').debug(sendResult);
        // await vendorTempService.storeSendEmailCodeCredential(code.toLowerCase(), detailType, { username, email: address, tenantId });

        const testEmailAddress = nodemailer.getTestMessageUrl(sendResult);

        if (testEmailAddress && isURL(testEmailAddress)) {
            log('send-forget-password-email').debug(`email code is ${code}, email content at ${testEmailAddress}`);
        } else {
            log('send-forget-password-email').debug(`email code is ${code}`);
        }
    }

    /**
     * 发送忘记密码的验证码
     *
     * @param {string} address
     * @param {string} username
     * @param {string} tenantId
     * @returns
     * @memberof Email
     */
    async sendForgetPasswordEmailCode(address: string/*, username: string, tenantId: string*/) {
        return await this.sendEmailCode(address/*, username, 'forget-pwd-code', tenantId*/);
    }

    /**
     * 发送注册用户时的验证码
     *
     * @param {string} address
     * @param {string} username
     * @param {string} tenantId
     * @returns
     * @memberof Email
     */
    async sendRegisterEmailCode(address: string/*, username: string, tenantId: string*/) {
        return await this.sendEmailCode(address/*, username, 'register-user-code', tenantId*/);
    }

    /**
     * 发送注册的用户审批通过的通知邮件
     *
     * @param {string} address
     * @param {string} username
     * @memberof Email
     */
    async sendRegisterUserApprovedNoticeEmail(address: string/*, username: string*/) {
        // const templete = fs.readFileSync(path.resolve(__dirname, '../../assets/approved.ejs')).toString();

        // await this.send(address, '注册结果通知', ejs.render(templete, { username, title: '注册结果通知' }));
        await this.send(address, '注册结果通知', 'html字符串');
    }

    /**
     * 发送用户应该周期性更改密码的通知邮件
     *
     * @param {string} address 邮箱地址
     * @param {string} username 用户称呼
     * @param {string} deadline 更改密码的截止日期
     * @memberof Email
     */
    async sendPasswordShouldBeResetedEmail(address: string/*, username: string, deadline: string*/) {
        // const templete = fs.readFileSync(path.resolve(__dirname, '../../assets/resetPassword.ejs')).toString();

        // await this.send(address, '更新密码通知', ejs.render(templete, { username, deadline, title: '更新密码通知' }));
        await this.send(address, '更新密码通知', 'html字符串');
    }
}

export default new Email();
