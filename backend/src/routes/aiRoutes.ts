/**
 * AI Routes
 */

import { Hono } from 'hono';
import { chat, autofill, recommend, conflicts } from '../controllers/aiController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const aiRoutes = new Hono();

aiRoutes.use('*', authenticate);

// Chat assistant for employees and team leads
aiRoutes.post('/chat', chat);

// Auto-fill for leave form
aiRoutes.post('/autofill', autofill);

// Recommendation for approval (Team Lead and Admin)
aiRoutes.get('/recommend/:leaveId', authorize('team_lead', 'admin'), recommend);

// Conflict detection
aiRoutes.post('/conflicts', conflicts);

export default aiRoutes;
