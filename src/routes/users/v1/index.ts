import express from 'express';
import search from './search';

const router = express.Router();

router.use('/search', search);

export default router;
