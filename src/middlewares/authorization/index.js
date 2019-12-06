const _validate = require('./json_web_token');

const _JWTcheck = new _validate(process.env.JWT_APP_NAME, process.env.JWT_APP_ID, process.env.JWT_APP_SECERT);


/**
 * 验证json web token
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
module.exports = (req, res, next) => {
    if (req.headers.authorization) {
        const _array = req.headers.authorization.split(' ');

        let authToken = _array[1], authType = _array[0];

        if (authType === 'JWT' && _JWTcheck.verify(authToken).allowed === false) {
            res.status(400).send(`Bad request(wrong Authorization)! Refused : ${_JWTcheck.verify(authToken).info}`);
        } else {
            next();
        }
    } else {
        res.status(400).send('Bad request(no Authorization)! Refused.');
    }
};
