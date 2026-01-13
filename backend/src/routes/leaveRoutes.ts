/**
 * Leave Routes
 */

import { Hono } from 'hono';
import {
    applyLeave,
    getMyLeaves,
    getTeamLeaves,
    getAllLeaves,
    approveLeave,
    rejectLeave,
    getLeave
} from '../controllers/leaveController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const leaveRoutes = new Hono();

// All routes require authentication
leaveRoutes.use('*', authenticate);

// Any authenticated user can apply for leave and view their own
leaveRoutes.post('/', applyLeave);
leaveRoutes.get('/my', getMyLeaves);

// Team Lead routes
leaveRoutes.get('/team', authorize('team_lead', 'admin'), getTeamLeaves);

// Admin routes
leaveRoutes.get('/all', authorize('admin'), getAllLeaves);

// Approval routes (Team Lead and Admin)
leaveRoutes.put('/:id/approve', authorize('team_lead', 'admin'), approveLeave);
leaveRoutes.put('/:id/reject', authorize('team_lead', 'admin'), rejectLeave);

// Get single leave
leaveRoutes.get('/:id', getLeave);

export default leaveRoutes;
