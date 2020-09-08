const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const httpContext = require('express-http-context');

const { serverJWTcheck,
    acceptRequestHandle,
    successResponseHandle,
    errorHandle,
    failureHandle,
    noPermissionHandle,
    notFoundHandle,
    serverErrorHandle,
    tooManyRequestsHandle
} = require('./middlewares');
const restApi = require('./routes');
const { errorType } = require('../src/configs');


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
app.use(httpContext.middleware);

app.use(express.static(path.resolve(__dirname, '../public/doc')));

app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        let apidoc = path.resolve(__dirname, '../public/doc/index.html');

        if (fs.existsSync(apidoc)) {
            res.sendFile(apidoc);
        } else {
            res.send('文档未找到或未生成.');
        }
    } else {
        res.send('welcome');
    }
});

/**自定义中间件 */
app.use(serverJWTcheck);
app.use(acceptRequestHandle);
app.use(successResponseHandle);
app.use(failureHandle);
app.use(noPermissionHandle);
app.use(notFoundHandle);
app.use(serverErrorHandle);
app.use(tooManyRequestsHandle);

/**加载路由 */
app.use(restApi);

app.use('*', () => {
    throw new Exception('URL not found!', errorType.URL_NOT_FOUND);
});

/**捕捉路由中throw new Eexception的情况 */
app.use(errorHandle);

module.exports = app;
