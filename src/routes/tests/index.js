const router = require('express').Router();
const user = require('./user');
const test = require('./test');

router.use('/test', test);
router.use('/user', user);

module.exports = router;
