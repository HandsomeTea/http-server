const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');

const { auditType } = require('./conf');
const { responseType, devLogger, auditLogger, traceLogger } = require('./middlewares');
const restApi = require('./routes');


/**
 * 建立接口路由和加载中间件
 *
 * 中间件放置的位置对rps指标的影响，测试结果：
 * 将中间件放在路由模块外面，比放在里面时的rps高
 * 所以尽量将中间件放在路由外面，某些路由独有的中间件可以放在路由模块里面
 */
/**常用中间件 */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(compression());
/**工具函数封装 */
app.use(traceLogger);
app.use(auditLogger);
app.use(devLogger);
app.use(responseType);
/**跟路由处理 */
app.get('/', (req, res) => {
    // res.redirect('tests/test/12312');
    res.send('no deal');
});
/**加载路由 */
app.use(restApi);

/**捕捉路由中未处理的错误，即直接throw new Error的情况 */
app.use((err, req, res, next) => {/* eslint-disable-line*/
    audit(auditType.error).fatal(`${err.stack}`);
    res.serverError('Something broke! please try again.');
});

module.exports = app;
