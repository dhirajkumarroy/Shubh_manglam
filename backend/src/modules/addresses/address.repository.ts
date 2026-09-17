import { prisma } from '../../config/database';
import { CreateAddressDto, UpdateAddressDto } from './address.types';

export class AddressRepository {
  async listUserAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findAddressById(id: string) {
    return prisma.address.findUnique({
      where: { id },
    });
  }

  async createAddress(userId: string, data: CreateAddressDto) {
    return prisma.$transaction(async (tx) => {
      const addressCount = await tx.address.count({ where: { userId } });
      const shouldBeDefault = data.isDefault || addressCount === 0;

      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: data.label,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          village: data.village,
          locality: data.locality,
          city: data.city,
          district: data.district,
          state: data.state,
          country: data.country ?? 'India',
          pincode: data.pincode,
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async updateAddress(id: string, userId: string, data: UpdateAddressDto) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          label: data.label,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          village: data.village,
          locality: data.locality,
          city: data.city,
          district: data.district,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: data.isDefault,
        },
      });
    });
  }

  async deleteAddress(id: string) {
    return prisma.address.delete({
      where: { id },
    });
  }
}
