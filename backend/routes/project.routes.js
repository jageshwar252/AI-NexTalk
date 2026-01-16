import {Router} from 'express';
import {body} from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';

const router = Router();

router.post('/create',
    authMiddleWare.authUser,
    body('name').isString().withMessage('Project name is required').notEmpty().withMessage('Project name cannot be empty'),
    projectController.createProject
)

router.get('/all',
    authMiddleWare.authUser,
    projectController.getAllProject
)

router.put('/add-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required').notEmpty().withMessage('Project ID cannot be empty'),
    body('users').isArray({ min: 1 }).withMessage('Users must be a non-empty array')
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
    projectController.addUserToProject
)

router.get('/get-project/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectByIdController
);

export default router;