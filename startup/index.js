const crypto = require('crypto');

process.env.INSTANCEID = crypto.randomBytes(24).toString('hex').substring(0, 17);
global.socketConnectionNum = 0;
global.socketOnlineNum = 0;
global.IntervalPing = 30; //ping的间隔,单位为秒

require('./log');
require('./env');
require('./exception');
