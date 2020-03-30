const check = require('./check');

module.exports = server => {
    server.use(check, 'check');
};
