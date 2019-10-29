import { Router } from 'express';

const router = Router();

router.get('/test', (req, res) => {
    req.trace().info('123123123');
    req.log().info('123sdfsdf', '123123ssssssssssssssssssss');
    req.audit('system').warn('22sssss');
    res.notFound({ result: '测试成功' }, 'USER_NOT_FOUND');
});

export default router;
