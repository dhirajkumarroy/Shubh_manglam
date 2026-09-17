import { AddressRepository } from './address.repository';
import { CreateAddressDto, UpdateAddressDto } from './address.types';
import { NotFoundError, ForbiddenError } from '../../common/utils/app-error';
import { prisma } from '../../config/database';

export class AddressService {
  private repo: AddressRepository;

  constructor() {
    this.repo = new AddressRepository();
  }

  async listAddresses(userId: string) {
    return this.repo.listUserAddresses(userId);
  }

  async getAddressById(userId: string, addressId: string) {
    const address = await this.repo.findAddressById(addressId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    if (address.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this address');
    }
    return address;
  }

  async createAddress(userId: string, data: CreateAddressDto) {
    return this.repo.createAddress(userId, data);
  }

  async updateAddress(userId: string, addressId: string, data: UpdateAddressDto) {
    const address = await this.repo.findAddressById(addressId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    if (address.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this address');
    }

    return this.repo.updateAddress(addressId, userId, data);
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.repo.findAddressById(addressId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    if (address.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this address');
    }

    await this.repo.deleteAddress(addressId);

    // If the deleted address was default, promote the newest remaining address to default
    if (address.isDefault) {
      const remaining = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }
  }
}
