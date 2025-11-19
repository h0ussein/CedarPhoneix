import express from 'express';
import { sendContactMessage } from '../controller/contactController.js';

const router = express.Router();

// Public route - no authentication required
router.post('/', sendContactMessage);

export default router;

