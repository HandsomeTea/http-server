const { Router } = require('express');

const search = require('./search');

const router = Router();

router.use('/search', search);

module.exports = router;
