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
 *     summary: Retrieve dashboard statistics
 *     description: Returns counts for total users, total vehicles, active vehicles, total bookings, completed bookings, and pending bookings.
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

/**
 * @openapi
 * /admin/vehicles:
 *   get:
 *     summary: Retrieve paginated vehicles list
 *     description: Returns a paginated and optionally filtered list of vehicles sorted by newest first.
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, REJECTED, SUSPENDED]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicles list retrieved successfully.
 */
router.get('/vehicles', controller.listVehicles);

/**
 * @openapi
 * /admin/vehicles/{id}:
 *   get:
 *     summary: Retrieve vehicle details
 *     description: Returns detailed profile and owner information for a specific vehicle.
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
 *         description: Vehicle details retrieved successfully.
 *       404:
 *         description: Vehicle not found.
 */
router.get('/vehicles/:id', controller.getVehicleDetails);

/**
 * @openapi
 * /admin/vehicles/{id}/approve:
 *   patch:
 *     summary: Approve a vehicle listing
 *     description: Sets vehicle status to ACTIVE and allows users to request bookings.
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
 *         description: Vehicle listing approved successfully.
 *       404:
 *         description: Vehicle not found.
 */
router.patch('/vehicles/:id/approve', controller.approveVehicle);

/**
 * @openapi
 * /admin/vehicles/{id}/reject:
 *   patch:
 *     summary: Reject a vehicle listing
 *     description: Sets vehicle status to REJECTED.
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
 *         description: Vehicle listing rejected successfully.
 *       404:
 *         description: Vehicle not found.
 */
router.patch('/vehicles/:id/reject', controller.rejectVehicle);

/**
 * @openapi
 * /admin/vehicles/{id}/suspend:
 *   patch:
 *     summary: Suspend a vehicle listing
 *     description: Sets vehicle status to SUSPENDED.
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
 *         description: Vehicle listing suspended successfully.
 *       404:
 *         description: Vehicle not found.
 */
router.patch('/vehicles/:id/suspend', controller.suspendVehicle);

/**
 * @openapi
 * /admin/bookings:
 *   get:
 *     summary: Retrieve paginated bookings list
 *     description: Returns a paginated and optionally filtered list of bookings sorted by newest first.
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bookings list retrieved successfully.
 */
router.get('/bookings', controller.listBookings);

/**
 * @openapi
 * /admin/bookings/{id}:
 *   get:
 *     summary: Retrieve booking details
 *     description: Returns detailed vehicle, customer, and owner information for a specific booking.
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
 *         description: Booking details retrieved successfully.
 *       404:
 *         description: Booking not found.
 */
router.get('/bookings/:id', controller.getBookingDetails);

export default router;
