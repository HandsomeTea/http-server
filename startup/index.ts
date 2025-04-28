import crypto from 'crypto';

process.env.INSTANCEID = crypto.randomBytes(24).toString('hex').substring(0, 24);
global.IntervalCleanUnusedInstance = 30;
global.IntervalUpdateInstance = 10;

import './alias';
import './exception';
import './log';
import './env';
import './otel';
