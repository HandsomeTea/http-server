const JWTValidate = require('../middlewares/authorization/json_web_token');

/**
 * 生成json web token
 * @returns
 */
exports.JWTgeneral = () => {
    return new JWTValidate(process.env.JWT_APP_NAME, process.env.JWT_APP_ID, process.env.JWT_APP_SECERT).sign();
};
