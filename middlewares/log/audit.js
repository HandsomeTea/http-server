const { auditType } = require('../../conf');

module.exports = (req, res, next) => {
    req.audit = (_module = auditType.request) => audit(_module);
    next();
};
