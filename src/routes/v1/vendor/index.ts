import express from 'express';
import oauth from './oauth';

const router = express.Router();

/** /api/v1/oauth */
router.use('/oauth', oauth);

export default router;
