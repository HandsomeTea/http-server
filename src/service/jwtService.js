const jwt = require('jsonwebtoken');

class JWT {
    constructor() {
        this.app = process.env.JWT_APP_NAME;
        this.appId = process.env.JWT_APP_ID;
        this.appSecert = process.env.JWT_APP_SECERT;
    }

    /**
     * 生成JWT
     * 一般携带在heep请求headers的Authorization字段中
     * @returns
     * @memberof JWT
     */
    sign() {
        return 'JWT ' + jwt.sign({ iss: this.app, sub: this.appId }, this.appSecert, {
            expiresIn: 60, // 有效期 60秒
            noTimestamp: true,
            header: {
                alg: 'HS256',
                typ: 'JWT'
            }
        });
    }

    /**
     * 验证JWT
     * @param {*} token
     * @returns
     * @memberof JWT
     */
    verify(_jsonWebToken) {
        let data = null;

        try {
            data = jwt.verify(_jsonWebToken, this.appSecert, {
                issuer: this.app,
                subject: this.appId,
                algorithms: ['HS256']
            });
        } catch (err) {
            return {
                allowed: false,
                // info: `${err.name}: ${JSON.stringify(err.message)}`
                info: ''
            };
        }
        if (data.exp >= Date.now() / 1000 + 60) {
            return {
                allowed: false,
                // info: 'Server Check Failed by Authorization. Timeout!'
                info: ''
            };
        }

        return {
            allowed: true,
            // info: 'Server Check Sucess by Authorization.'
            info: ''
        };
    }
}

module.exports = new JWT();
