/* eslint-disable */
import _ from 'underscore';
import OS from 'os';

import common from './common';

export default {
    apps: [_.extend(common, {
        instances: OS.cpus().length,
        exec_mode: 'cluster'
    })]
};
