const { Router } = require('express');
const { httpStatus } = require('../../utils');

const router = Router();

router.post('/:id', (req, res) => {
    res.tooManyRequests({ result: '测试成功' }, httpStatus.tooMany);
});
module.exports = router;