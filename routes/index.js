const { Router } = require('express');
const rootRouter = Router();

const test = require('./tests');
const user = require('./users');
const { JWTcheck } = require('../middlewares');


rootRouter.use('/tests', test);
// 为/user下的接口加jwt鉴权
rootRouter.use('/user', user, JWTcheck);

module.exports = rootRouter;
