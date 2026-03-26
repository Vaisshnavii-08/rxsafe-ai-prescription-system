/**
 * Auth Routes (TypeScript)
 * 
 * Handles user signup, login, and profile retrieval.
 */

import express, { Request, Response, NextFunction } from 'express';
import authController from '../controllers/authController';
import {protect} from '../utils/authMiddleware';  // renamed for consistency
import validators from '../utils/validators';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', (req, res) => authController.signup(req, res));


/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post(
  '/login',
  validators.validate(validators.loginSchema),
  (req: Request, res: Response, next: NextFunction) => authController.login(req, res)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get(
  '/me',
  protect,
  (req: Request, res: Response, next: NextFunction) => authController.getMe(req, res,)
);

export default router;
