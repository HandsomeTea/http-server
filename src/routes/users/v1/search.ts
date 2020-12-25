import express from 'express';
import { MyResponse } from '../../../../http';

const router = express.Router();

router.post('/:id', (_req, res) => {
    return (res as MyResponse).success();// eslint-disable-line no-extra-parens
});

export default router;
