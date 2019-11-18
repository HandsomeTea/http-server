import { Router } from 'express';

import test from './tests';
import user from './users';
import { JWTcheck } from '../middlewares';

const rootRouter = Router();

rootRouter.use('/tests', test);
rootRouter.use('/user', user, JWTcheck);

export default rootRouter;
