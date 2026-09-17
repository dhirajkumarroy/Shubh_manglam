import { Router } from 'express';
import { AddressController } from './address.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AddressController();

// All address routes require authenticated user
router.use(authenticateRequest);

router.get('/', controller.listAddresses);
router.post('/', controller.createAddress);
router.get('/:addressId', controller.getAddress);
router.patch('/:addressId', controller.updateAddress);
router.delete('/:addressId', controller.deleteAddress);

export default router;
