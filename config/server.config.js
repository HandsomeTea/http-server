const _service = {
    development: {
        tag: 'development',
        REDIS_URL: 'redis://localhost:6379',
        MONGO_URL: 'mongodb://localhost:3001/meteor',
        ROOT_URL: 'http://loaclhost:3000'
    },
    test: {
        tag: 'test',
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
        MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:3001/meteor',
        ROOT_URL: process.env.ROOT_URL || 'http://loaclhost:3000'
    },
    production: {
        tag: 'production',
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
        MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:3001/meteor',
        ROOT_URL: process.env.ROOT_URL || 'http://loaclhost:3000'
    }
};


exports.service = _service[process.env.NODE_ENV || 'development'];
