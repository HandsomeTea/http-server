/* eslint-disable */
module.exports = {
    apps: [{
        name: 'custom service',
        script: 'service.js',
        instances: 1,
        autorestart: true,
        watch: true,
        ignore_watch: ['node_modules', '.vscode', 'doc', 'logs', 'api*', '*.yaml', '*.json', './pm2.config.js'],
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        },
        out_file: './logs/pm2-app.log',
        error_file: './logs/pm2-err.log'
    }]
};
