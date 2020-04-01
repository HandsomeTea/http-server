const { JWT } = require('../service');

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
        const authToken = _array[1];
        const authType = _array[0];
        const result = JWT.verify(authToken);

        if (authType === 'JWT' && result.allowed === false) {
            res.status(400).send(`Bad request(wrong Authorization)! Refused : ${result.info}`);
        } else {
            next();
        }
    } else {
        res.status(400).send('Bad request(no Authorization)! Refused.');
    }
};
