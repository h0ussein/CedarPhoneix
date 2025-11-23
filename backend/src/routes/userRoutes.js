import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  updateUserRole,
  verifyEmail,
  resendVerificationEmail
} from '../controller/userController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Private routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);

// Admin routes
router.get('/', authenticate, authorizeAdmin, getAllUsers);
router.delete('/:id', authenticate, authorizeAdmin, deleteUser);
router.put('/:id/role', authenticate, authorizeAdmin, updateUserRole);

export default router;

