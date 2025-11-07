import express from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  updateFeaturedProducts,
  updateRelatedProducts,
  toggleProductVisibility
} from '../controller/productController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProduct);

// Admin routes
router.post('/', authenticate, authorizeAdmin, upload.single('image'), createProduct);
router.put('/featured/update', authenticate, authorizeAdmin, updateFeaturedProducts);
router.put('/:id/related', authenticate, authorizeAdmin, updateRelatedProducts);
router.put('/:id/visibility', authenticate, authorizeAdmin, toggleProductVisibility);
router.put('/:id', authenticate, authorizeAdmin, upload.single('image'), updateProduct);
router.delete('/:id', authenticate, authorizeAdmin, deleteProduct);

export default router;

