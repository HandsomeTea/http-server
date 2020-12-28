import express from 'express';

const router = express.Router();

router.post('/:id', (_req, res) => {
    return res.success();
});

export default router;
