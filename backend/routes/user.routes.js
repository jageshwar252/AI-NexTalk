import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMidlleware from "../middleware/auth.middleware.js";

const router = Router();

router.post('/register',
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
    userController.createUserController);

router.post('/login',
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({min:3}).withMessage('Password must be at least 3 characters long'),
    userController.loginUserController);

router.get('/profile', authMidlleware.authUser, userController.profileController);
router.post('/logout', authMidlleware.authUser, userController.logoutController);
router.get('/all', authMidlleware.authUser, userController.getAllUsersController);

export default router;