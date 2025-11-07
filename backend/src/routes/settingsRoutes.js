import express from 'express';
import {
  getSettings,
  updateDefaultDeliveryPrice,
  getDefaultDeliveryPrice
} from '../controller/settingsController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route - get default delivery price
router.get('/delivery-price', getDefaultDeliveryPrice);

// Admin routes
router.get('/', authenticate, authorizeAdmin, getSettings);
router.put('/delivery-price', authenticate, authorizeAdmin, updateDefaultDeliveryPrice);

export default router;

