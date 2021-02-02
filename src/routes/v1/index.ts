import express from 'express';
import users from './users';

const router = express.Router();

/** /api/v1/users */
router.use('/users', users);

export default router;
