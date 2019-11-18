const { Router } = require('express');
const rootRouter = Router();

const test = require('./tests');
const user = require('./users');
const { JWTcheck } = require('../middlewares');


rootRouter.use('/tests', test);
rootRouter.use('/user', user, JWTcheck);

module.exports = rootRouter;
