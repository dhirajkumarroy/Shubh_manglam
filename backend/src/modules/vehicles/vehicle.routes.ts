import { Router } from 'express';
import { VehicleController } from './vehicle.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { uploadVehicleImages } from '../../middlewares/upload.middleware';

const router = Router();
const controller = new VehicleController();

/**
 * @openapi
 * /vehicles:
 *   post:
 *     summary: Register a new vehicle listing
 *     description: Creates a new vehicle registry entry. Requires JWT token and the OWNER or ADMIN role. Uploads 1 to 10 images.
 *     tags:
 *       - Vehicles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - brand
 *               - model
 *               - year
 *               - vehicleNumber
 *               - fuelType
 *               - transmission
 *               - seatCapacity
 *               - pricePerDay
 *               - city
 *               - latitude
 *               - longitude
 *               - description
 *               - images
 *             properties:
 *               title:
 *                 type: string
 *                 example: Mercedes-Benz C-Class
 *               brand:
 *                 type: string
 *                 example: Mercedes-Benz
 *               model:
 *                 type: string
 *                 example: C-Class C300
 *               year:
 *                 type: integer
 *                 example: 2023
 *               vehicleNumber:
 *                 type: string
 *                 example: MH12AB1234
 *               fuelType:
 *                 type: string
 *                 enum: [PETROL, DIESEL, CNG, ELECTRIC, HYBRID]
 *                 example: PETROL
 *               transmission:
 *                 type: string
 *                 enum: [MANUAL, AUTOMATIC]
 *                 example: AUTOMATIC
 *               seatCapacity:
 *                 type: integer
 *                 example: 5
 *               pricePerDay:
 *                 type: number
 *                 example: 120.50
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 19.0760
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 72.8777
 *               description:
 *                 type: string
 *                 example: Well-maintained premium sedan with luxury seats and panoramic sunroof.
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of vehicle images (1-10 files, max 10MB each)
 *     responses:
 *       201:
 *         description: Vehicle registered successfully.
 *       400:
 *         description: Validation payload error, invalid file limits, or duplicate license plate.
 *       401:
 *         description: Unauthorized. Authentication token is missing, invalid, or expired.
 *       403:
 *         description: Forbidden. Authenticated user does not possess OWNER or ADMIN roles.
 */
router.post('/', authenticateRequest, uploadVehicleImages, controller.createVehicle);

/**
 * @openapi
 * /vehicles:
 *   get:
 *     summary: Retrieve public vehicle catalog listings
 *     description: Searches and lists all active, approved vehicle records based on multiple filter and sorting combinations.
 *     tags:
 *       - Vehicles
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Search by city (case-insensitive contains match)
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Search by manufacturer brand (case-insensitive contains match)
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [PETROL, DIESEL, CNG, ELECTRIC, HYBRID]
 *         description: Filter by fuel type
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *           enum: [MANUAL, AUTOMATIC]
 *         description: Filter by transmission type
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per day filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per day filter
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by availability toggle
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page offset index
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records to return
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, priceAsc, priceDesc]
 *           default: newest
 *         description: Sorting order
 *     responses:
 *       200:
 *         description: Catalog vehicles retrieved successfully.
 *       400:
 *         description: Query validation error.
 */
router.get('/', controller.listVehicles);

/**
 * @openapi
 * /vehicles/my:
 *   get:
 *     summary: Retrieve owner registered vehicles
 *     description: Lists all vehicles registered to the authenticated owner account (active, pending, suspended, rejected).
 *     tags:
 *       - Vehicles
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
 *     responses:
 *       200:
 *         description: Owner listings retrieved successfully.
 *       401:
 *         description: Unauthorized access.
 */
router.get('/my', authenticateRequest, controller.listMyVehicles);

/**
 * @openapi
 * /vehicles/{id}:
 *   get:
 *     summary: Retrieve vehicle details
 *     description: Returns detailed records, all images, and owner basic profiles by vehicle UUID.
 *     tags:
 *       - Vehicles
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
router.get('/:id', controller.getVehicleDetails);

/**
 * @openapi
 * /vehicles/{id}:
 *   patch:
 *     summary: Update vehicle properties
 *     description: Performs partial updates on a vehicle's fields. Restricted to the listing owner or an ADMIN.
 *     tags:
 *       - Vehicles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               vehicleNumber:
 *                 type: string
 *               fuelType:
 *                 type: string
 *                 enum: [PETROL, DIESEL, CNG, ELECTRIC, HYBRID]
 *               transmission:
 *                 type: string
 *                 enum: [MANUAL, AUTOMATIC]
 *               seatCapacity:
 *                 type: integer
 *               pricePerDay:
 *                 type: number
 *               city:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               description:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vehicle updated successfully.
 *       400:
 *         description: Payload validation errors.
 *       401:
 *         description: Unauthorized access.
 *       403:
 *         description: Forbidden. User does not own this listing.
 *       404:
 *         description: Vehicle not found.
 */
router.patch('/:id', authenticateRequest, controller.updateVehicle);

/**
 * @openapi
 * /vehicles/{id}:
 *   delete:
 *     summary: Soft delete vehicle listing
 *     description: Changes the status of the vehicle to SUSPENDED to soft-delete it. Restricted to the owner or an ADMIN.
 *     tags:
 *       - Vehicles
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
 *         description: Vehicle deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. User does not own this listing.
 *       404:
 *         description: Vehicle not found.
 */
router.delete('/:id', authenticateRequest, controller.deleteVehicle);

export default router;
