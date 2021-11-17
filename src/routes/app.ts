import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import httpContext from 'express-http-context';
import { errorType, getENV } from '@/configs';

const app = express();

/**
 * 建立接口路由和加载中间件
 *
 * 中间件放置的位置对rps指标的影响，测试结果：
 * 将中间件放在路由模块外面，比放在里面时的rps高
 * 所以尽量将中间件放在路由外面，某些路由独有的中间件可以放在路由模块里面
 */
/**常用中间件 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(httpContext.middleware);

app.use(express.static(path.resolve(__dirname, '../../public/doc')));

app.get('/', (_req, res) => {
    if (getENV('NODE_ENV') === 'development') {
        const apidoc = path.resolve(__dirname, '../../public/doc/index.html');

        if (fs.existsSync(apidoc)) {
            res.sendFile(apidoc);
        } else {
            res.send('文档未找到或未生成.');
        }
    } else {
        res.send('welcome');
    }
});

import {
    // JWTCheckHandle,
    acceptRequestHandle,
    successResponseHandle,
    errorHandle
} from '@/middlewares';

/**自定义中间件 */
// app.use(JWTCheckHandle);
app.use(acceptRequestHandle);
app.use(successResponseHandle);

/**加载路由 */
import v1 from './v1';

app.use('/api/v1', v1);
app.use('*', () => {
    throw new Exception('URL not found!', errorType.URL_NOT_FOUND);
});

/**捕捉路由中throw new Eexception的情况 */
app.use(errorHandle);

export default app;
