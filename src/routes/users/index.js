const router = require('express').Router();
const search = require('./search');

router.use('/search', search);

module.exports = router;
