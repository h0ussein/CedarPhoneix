import express from 'express';
import {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  toggleCategoryVisibility,
  deleteCategory
} from '../controller/categoryController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Admin routes (must come before /:id to avoid route conflicts)
router.get('/admin/all', authenticate, authorizeAdmin, getAllCategoriesAdmin);
router.post('/', authenticate, authorizeAdmin, upload.single('image'), createCategory);
router.put('/:id/visibility', authenticate, authorizeAdmin, toggleCategoryVisibility);
router.put('/:id', authenticate, authorizeAdmin, upload.single('image'), updateCategory);
router.delete('/:id', authenticate, authorizeAdmin, deleteCategory);

// Public routes
router.get('/', getAllCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);

export default router;

