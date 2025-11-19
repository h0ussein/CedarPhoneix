import express from 'express';
import {
  getPurchases,
  createPurchase,
  deletePurchase,
  updatePurchase
} from '../controller/inventoryPurchaseController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorizeAdmin, getPurchases);
router.post('/', authenticate, authorizeAdmin, createPurchase);
router.delete('/:id', authenticate, authorizeAdmin, deletePurchase);
router.put('/:id', authenticate, authorizeAdmin, updatePurchase);

export default router;
