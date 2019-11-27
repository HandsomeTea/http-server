const { logModule } = require('../../config/logger.config');

module.exports = (req, res, next) => {
    req.log = (_module = logModule.api) => log(_module);
    next();
};
