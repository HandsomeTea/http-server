const { Router } = require('express');

const user = require('./user');
const test = require('./test');

const router = Router();

router.use('/test', test);
router.use('/user', user);

module.exports = router;
