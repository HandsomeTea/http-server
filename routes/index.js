const { Router } = require('express');
const rootRouter = Router();

const testApi = require('./tests');
const userApi = require('./users');
const { JWTcheck } = require('../middlewares');

rootRouter.use('/tests', testApi);
// 为/user下的接口加jwt鉴权
rootRouter.use('/user', JWTcheck, userApi);

module.exports = rootRouter;
