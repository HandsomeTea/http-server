import express from 'express';
import asyncHandler from 'express-async-handler';
import { MyResponse } from '../../../../http';

const router = express.Router();

router.post('/:id', asyncHandler(async (_req, res) => {
    return (res as MyResponse).success();// eslint-disable-line no-extra-parens
}));

export default router;
