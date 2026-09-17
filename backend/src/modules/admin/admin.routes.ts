import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateRequest, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AdminController();

// Protect all admin endpoints with authentication and admin role enforcement
router.use(authenticateRequest, requireAdmin);

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     summary: Retrieve Shubh Mangalam dashboard statistics
 *     description: Returns counts for total users, total vendors, approved vendors, pending vendors, event types, and categories.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. Requires Admin role.
 */
router.get('/dashboard', controller.getDashboardStats);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: Retrieve paginated users list
 *     description: Returns a paginated and optionally filtered list of users sorted by newest first.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users list retrieved successfully.
 */
router.get('/users', controller.listUsers);

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     summary: Retrieve user details
 *     description: Returns detailed profile information for a specific user.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details retrieved successfully.
 *       404:
 *         description: User not found.
 */
router.get('/users/:id', controller.getUserDetails);

/**
 * @openapi
 * /admin/users/{id}/block:
 *   patch:
 *     summary: Block a user account
 *     description: Prevents a user from authenticating (logging in or refreshing tokens) and flags isBlocked.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User has been blocked successfully.
 *       404:
 *         description: User not found.
 */
router.patch('/users/:id/block', controller.blockUser);

/**
 * @openapi
 * /admin/users/{id}/unblock:
 *   patch:
 *     summary: Unblock a user account
 *     description: Restores user authentication access.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User has been unblocked successfully.
 *       404:
 *         description: User not found.
 */
router.patch('/users/:id/unblock', controller.unblockUser);

export default router;
