/* eslint-disable */
const _ = require('underscore');
const numCPUs = require('os').cpus().length;

const common = require('./common');

module.exports = {
    apps: [_.extend(common, {
        instances: numCPUs,
        exec_mode: 'cluster'
    })]
};
