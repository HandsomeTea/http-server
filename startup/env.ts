import fs from 'fs';
import path from 'path';
import { setENV } from '@/configs';
const proConfigPath = '/opt/config/application.yaml';
const localConfigPath = path.resolve(__dirname, '../application-dev-example.yaml');

/**
 * 项目启动时在环境变量上挂载yaml文件的配置数据
 * 并监听配置数据的变化，如果配置改变，则更新环境变量上挂载的值
 * 优先取proConfigPath路径下的的配置
 * 如果找不到则取开发环境下对应目录localConfigPath的配置
 * 两者都取不到，默认获取的是process.env上原有的值，没有则为undefined
 */
if (fs.existsSync(proConfigPath)) {
    setENV(proConfigPath);
    fs.watchFile(proConfigPath, (_event, _productFile) => {
        if (_productFile) {
            setENV(proConfigPath);
        }
    });
} else if (fs.existsSync(localConfigPath)) {
    setENV(localConfigPath);
    fs.watchFile(localConfigPath, (_event, _localFile) => {
        if (_localFile) {
            setENV(localConfigPath);
        }
    });
}
