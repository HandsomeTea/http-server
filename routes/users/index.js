import { Router } from 'express';

import search from './search';

const router = Router();

router.use('/search', search);

export default router;
