const yaml = require('js-yaml');
const fs = require('fs');

const { envValidate } = require('./env-validate');
const { system } = require('../../utils');

const proConfigPath = process.productProcessEnvHotLoadPath;
const localConfigPath = process.devProcessEnvHotLoadPath;

/**
 * 将配置文件设置的环境变量更新到程序中
 * @param {string} _configFile
 */
const _setConfig = _configFile => {
    let config = {};

    try {
        config = yaml.safeLoad(fs.readFileSync(_configFile, 'utf8'));
    } catch (err) {
        system('set-env-value').error(`change env config failed : ${JSON.stringify({ response: err.response, message: err.message })}`);
    }

    let _arr = 0;

    for (let _key in config) {
        const _config = envValidate(_key, config[_key]);

        if (process.env[_key] !== _config) {
            _arr++;
            system('set-env-value').warn(`process.env.${_key} from ${JSON.stringify(process.env[_key])} to ${JSON.stringify(_config)}`);
            process.env[_key] = _config;
        }
    }
    system('set-env-value').warn(_arr > 0 ? `change env configuration from ${_configFile} success.` : 'the configuration of peocess.env no changed.');
};

/**
 * 项目启动时在环境变量上挂载yaml文件的配置数据
 * 并监听配置数据的变化，如果配置改变，则更新环境变量上挂载的值
 * 优先取process.productProcessEnvHotLoadPath路径下的的配置
 * 如果找不到则取开发环境下对应目录process.devProcessEnvHotLoadPath的配置
 * 两者都取不到，默认获取的是process.env上原有的值，没有则为undefined
 */
if (!!proConfigPath && fs.existsSync(proConfigPath)) {
    _setConfig(proConfigPath);
    fs.watchFile(proConfigPath, (event, _productFile) => {
        if (_productFile) {
            _setConfig(proConfigPath);
        }
    });
} else if (!!localConfigPath && fs.existsSync(localConfigPath)) {
    _setConfig(localConfigPath);
    fs.watchFile(localConfigPath, (event, _localFile) => {
        if (_localFile) {
            _setConfig(localConfigPath);
        }
    });
}
