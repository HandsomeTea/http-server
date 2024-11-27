import OS from 'os';

import common from './common';

export default {
	apps: [{
		...common,
		instances: OS.cpus().length,
		'exec_mode': 'cluster'
	}]
};
