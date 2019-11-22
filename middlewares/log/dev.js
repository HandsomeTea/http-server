const { logType } = require('../../conf');

module.exports = (req, res, next) => {
    req.log = (_module = logType.api) => log(_module);
    next();
};
