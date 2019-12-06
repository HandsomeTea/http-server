const { auditModule } = require('../../config/log.type');

/**
 * 捕捉路由中未处理的错误，即直接throw new Error的情况
 * @param {*} err
 * @param {*} res
 * @param {*} req
 * @param {*} next
 */
module.exports = (err, req, res, next) => { /* eslint-disable-line*/
    audit(auditModule.error).fatal(`${err.stack}`);
    res.send('Something broke! please try again.');
};
