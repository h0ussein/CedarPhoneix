import express from 'express';
import {
  createOrder,
  getOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder
} from '../controller/orderController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route (allows guest orders)
router.post('/', createOrder);

// Private routes
router.get('/myorders', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrder);

// Admin routes
router.get('/', authenticate, authorizeAdmin, getAllOrders);
router.put('/:id', authenticate, authorizeAdmin, updateOrderStatus);
router.delete('/:id', authenticate, authorizeAdmin, deleteOrder);

export default router;

