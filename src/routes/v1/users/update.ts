import express from 'express';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.post('/:id', asyncHandler(async (_req, res) => {
    return res.success();
}));

export default router;
