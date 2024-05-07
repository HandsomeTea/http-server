import express from 'express';
import ssh from './remote-ssh-task/api';

const router = express.Router();

/** /api/v1/feature */
router.use(ssh);

export default router;
