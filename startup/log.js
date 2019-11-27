const { updateOrCreateLogInstance, log, trace, audit, system } = require('../config/logger.config');

global.initLog = updateOrCreateLogInstance;
initLog();

global.log = _module => log(_module);
global.trace = (_module, _data) => trace(_module, _data);
global.audit = _module => audit(_module);
global.system = _module => system(_module);
