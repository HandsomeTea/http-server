/* eslint-disable */
import path from 'path';

export default {
    name: 'http-server',
    script: 'server.js',
    watch: (() => {
        const _list = ['../conf', '../middlewares', '../routes', '../service', '../startup', '../utils', '../app.js', '../server.js'];

        return _list.map(_path => {
            return path.resolve(__dirname, _path);
        });
    })(),
    watch_delay: 1000,
    autorestart: true,
    restart_delay: 1000,
    wait_ready: true, // 等待进程ready信号
    max_restarts: 3,
    max_memory_restart: '1G',
    env: {
        NODE_ENV: 'development'
    },
    env_production: {
        NODE_ENV: 'production'
    },
    time: false,
    out_file: null,
    error_file: '../logs/pm2-error.log'
};
