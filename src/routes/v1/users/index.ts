import express from 'express';
import search from './search';
import update from './update';

const router = express.Router();

/** /api/v1/users */
router.use(search, update);

export default router;
