const router = require('express').Router();
const { httpStatus } = require('../../utils');

router.post('/:id', (req, res) => {
    res.tooManyRequests({ result: 'user测试成功' }, httpStatus.tooMany);
});

module.exports = router;
