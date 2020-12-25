import express from 'express';
import v1 from './v1';

const router = express.Router();

// /users/v1
router.use('/v1', v1);

export default router;
