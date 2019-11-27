const { auditModule } = require('../../config/logger.config');

module.exports = (req, res, next) => {
    req.audit = (_module = auditModule.request) => audit(_module);
    next();
};
