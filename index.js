import express from 'express';
import path from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import http from 'http';
import { log, trace, audit } from './utils';

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

app.get('/test', (req, res) => {
    trace().info('123123123');
    log().info('123sdfsdf', '123123ssssssssssssssssssss');
    audit('system').warn('22sssss');
    res.send('测试成功');
});

/**加载解析请求体的中间件 */
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
    let addressIpv4 = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    const _logInfo = new Date().toISOString() + ' - 请求 >> ' + addressIpv4 + ' : ' + req.method + ' -> ' + req.protocol + '://' + req.get('host') + req.originalUrl;

    trace().info(_logInfo);
    log().info(_logInfo);

    if (Object.getOwnPropertyNames(req.body).length > 0) {
        log().debug('数据 >> ' + addressIpv4 + ' : ' + req.originalUrl + ' -> ' + JSON.stringify(req.body));
    }
    if (Object.getOwnPropertyNames(req.query).length > 0) {
        log().debug('数据 >> ' + addressIpv4 + ' : ' + req.originalUrl + ' -> ' + JSON.stringify(req.query));
    }
    next();
});

/**建立接口路由 */
// app.use('/menu', menu);

/**错误处理 */
app.use((req, res) => { //req, res,next
    if (req.method === 'GET' && req.originalUrl === '/favicon.ico') {
        res.status(200).send({ result: true });
    } else {
        res.status(500).send('Something broke!');
    }
});

/**单例启动，适合于pm2配合使用 */
http.createServer(app).listen(8008, '0.0.0.0', () => { //测试服:8002 正式服:443
    log().info('服务器启动成功');
});
