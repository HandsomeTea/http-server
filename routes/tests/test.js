const { Router } = require('express');
const { httpStatus } = require('../../utils');

const router = Router();

router.get('/:id', (req) => {
    req.trace().info('123123123');
    req.log().info(JSON.stringify(req.params));
    req.audit('system').warn('22sssss');
    // res.noPermission({ result: '测试成功' }, httpStatus.noPermissionUser);
    throw new Error('cuo wu');
});

router.post('/:id', (req, res) => {
    // req.trace().info('123123123');
    // req.log().info('123sdfsdf', '123123ssssssssssssssssssss');
    // req.audit('system').warn('22sssss');
    // res.success({ result: '测试成功' }, httpStatus.successSearch);
    // res.failure({ result: '测试成功' }, httpStatus.failedUpdate);
    // res.notFound({ result: '测试成功' }, httpStatus.notFoundUser);
    // res.serverError({ result: '测试成功' }, httpStatus.innerDBError);
    // res.noPermission({ result: '测试成功' }, httpStatus.noPermissionUser);
    res.tooManyRequests({ result: '测试成功' }, httpStatus.tooMany);
});
module.exports = router;
