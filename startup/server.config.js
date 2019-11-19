const path = require('path');

/**mongodb数据库的链接地址 */
process.mongoUrl = '';
/**生产环境下环境变量热加载配置的目录 */
process.productProcessEnvHotLoadPath = '';
/**开发环境下环境变量热加载配置的目录 */
process.devProcessEnvHotLoadPath = path.resolve(process.env.INIT_CWD, 'application-dev-example.yaml');
