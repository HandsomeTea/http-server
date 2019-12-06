const rootRouter = require('express').Router();

rootRouter.use('/tests', require('./tests'));
rootRouter.use('/users', require('./users'));

module.exports = rootRouter;
