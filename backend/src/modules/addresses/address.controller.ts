import { Request, Response, NextFunction } from 'express';
import { AddressService } from './address.service';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { createAddressSchema, updateAddressSchema } from './address.validation';

export class AddressController {
  private service: AddressService;

  constructor() {
    this.service = new AddressService();
  }

  listAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const addresses = await this.service.listAddresses(userId);
      res.status(200).json(ResponseDto.success('Addresses retrieved successfully.', addresses));
    } catch (error) {
      next(error);
    }
  };

  getAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { addressId } = req.params;
      const address = await this.service.getAddressById(userId, addressId);
      res.status(200).json(ResponseDto.success('Address retrieved successfully.', address));
    } catch (error) {
      next(error);
    }
  };

  createAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const validated = createAddressSchema.parse(req.body);
      const address = await this.service.createAddress(userId, validated);
      res.status(201).json(ResponseDto.success('Address created successfully.', address));
    } catch (error) {
      next(error);
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { addressId } = req.params;
      const validated = updateAddressSchema.parse(req.body);
      const updated = await this.service.updateAddress(userId, addressId, validated);
      res.status(200).json(ResponseDto.success('Address updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { addressId } = req.params;
      await this.service.deleteAddress(userId, addressId);
      res.status(200).json(ResponseDto.success('Address deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };
}
