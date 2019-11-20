const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');

const { traceId, response } = require('./utils');
const { logType, auditType, traceType } = require('./conf');
const restApi = require('./routes');


const app = express();

/**加载中间件 */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(compression());

/**跟路由处理 */
app.get('/', (req, res) => {
    // res.redirect('tests/test/12312');
    res.send('no deal');
});

/**工具函数封装 */
app.use((req, res, next) => {
    /**trace log配置 */
    if (!req.headers['x-b3-traceid']) {
        req.headers['x-b3-traceid'] = traceId();
        req.headers['x-b3-spanid'] = traceId();
    }

    /**日志封装 */
    req.log = (_module = logType.api) => log(_module);
    req.trace = (_module = traceType.default) => trace(_module, { traceId: req.headers['x-b3-traceid'], spanId: req.headers['x-b3-spanid'], parentSpanId: req.headers['x-b3-parentspanid'] });
    req.audit = (_module = auditType.request) => audit(_module);

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
app.use(restApi);

app.use((err, req, res, next) => {/* eslint-disable-line*/
    audit(auditType.error).fatal(`${err.stack}`);
    res.serverError({ result: 'Something broke! please try again.' });
});

module.exports = app;
