import express from 'express';
import {
  getProfitStats,
  getProductsWithCost,
  updateProductCostPrice,
  bulkUpdateCostPrices
} from '../controller/profitController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.get('/stats', authenticate, authorizeAdmin, getProfitStats);
router.get('/products', authenticate, authorizeAdmin, getProductsWithCost);
router.put('/products/:id/cost', authenticate, authorizeAdmin, updateProductCostPrice);
router.put('/products/bulk-cost', authenticate, authorizeAdmin, bulkUpdateCostPrices);

export default router;

