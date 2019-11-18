import { Router } from 'express';

import user from './user';
import test from './test';

const router = Router();

router.use('/index', test);
router.use('/user', user);

export default router;
