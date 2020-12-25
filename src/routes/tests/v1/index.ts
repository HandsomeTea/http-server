import express from 'express';
import test from './test';
import user from './user';

const router = express.Router();

router.use('/test', test);
router.use('/user', user);

export default router;
