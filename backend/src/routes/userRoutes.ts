/**
 * User Routes
 */

import { Hono } from 'hono';
import {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getProfile,
    updateProfile,
    getTeams,
    createTeam
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const userRoutes = new Hono();

// All routes require authentication
userRoutes.use('*', authenticate);

// Profile routes (any authenticated user)
userRoutes.get('/profile', getProfile);
userRoutes.put('/profile', updateProfile);

// Team routes
userRoutes.get('/teams', getTeams);
userRoutes.post('/teams', authorize('admin'), createTeam);

// Admin only routes
userRoutes.get('/', authorize('admin'), getAllUsers);
userRoutes.post('/', authorize('admin'), createUser);
userRoutes.get('/:id', authorize('admin'), getUser);
userRoutes.put('/:id', authorize('admin', 'employee', 'team_lead'), updateUser);
userRoutes.delete('/:id', authorize('admin'), deleteUser);

export default userRoutes;
