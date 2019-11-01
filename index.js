import path from 'path';
import fs from 'fs';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import './server.config';
/**为process.env挂载值，支持热更新 */
import './conf';
import { log, trace, audit, traceId, response } from './utils';
import test from './controllers';

const app = express();

/**挂载构建代码 */
app.use(express.static(path.join(__dirname, 'dist')));

/**是否有可挂载的构建代码的处理 */
app.get('/', (req, res) => {
    let doorFile = path.resolve(__dirname, 'dist/index.html');

    if (fs.existsSync(doorFile)) {
        res.sendFile(doorFile);
    } else {
        res.send('正在维护中，请稍后...');
    }
});

/**加载解析请求体的中间件 */
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
    let addressIpv4 = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    const _logInfo = new Date().toISOString() + ' - 请求 >> ' + addressIpv4 + ' : ' + req.method + ' -> ' + req.protocol + '://' + req.get('host') + req.originalUrl;

    trace().info(_logInfo);

    if (Object.getOwnPropertyNames(req.body).length > 0) {
        log().debug('数据 >> ' + addressIpv4 + ' : ' + req.originalUrl + ' -> ' + JSON.stringify(req.body));
    }
    if (Object.getOwnPropertyNames(req.query).length > 0) {
        log().debug('数据 >> ' + addressIpv4 + ' : ' + req.originalUrl + ' -> ' + JSON.stringify(req.query));
    }
    next();
});

/**健全验证等 */
//
//
//

/**工具函数封装 */
app.use((req, res, next) => {
    /**trace log配置 */
    if (!req.headers['x-b3-traceid']) {
        req.headers['x-b3-traceid'] = traceId();
        req.headers['x-b3-spanid'] = traceId();
    }

    /**日志封装 */
    req.log = _module => log(_module);
    req.trace = _module => trace(_module, { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] });
    req.audit = _module => audit(_module);

    /**返回数据封装 */
    const _status = response(res, req);

    res.success = (_data, _type = undefined) => _status.success(_data, _type);
    res.failure = (_data, _type = undefined) => _status.failure(_data, _type);
    res.notFound = (_data, _type = undefined) => _status.notFound(_data, _type);
    res.serverError = (_data, _type = undefined) => _status.internalError(_data, _type);
    res.noPermission = (_data, _type = undefined) => _status.unauthorized(_data, _type);
    res.tooManyRequests = (_data, _type = undefined) => _status.tooManyRequests(_data, _type);
    next();
});

/**建立接口路由 */
app.use('/test', test);

/**错误处理 */
app.use((req, res) => { //req, res, next
    if (req.method === 'GET' && req.originalUrl === '/favicon.ico') {
        res.status(200).send({ result: true });
    } else {
        res.status(500).send('Something broke!');
    }
});

debugger; /* eslint-disable-line*/

/**单例启动，适合于pm2配合使用 */
http.createServer(app).listen(8008, '0.0.0.0', () => {
    log().info('服务器启动成功');
});
