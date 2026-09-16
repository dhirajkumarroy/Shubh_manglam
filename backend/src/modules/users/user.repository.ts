import { User } from '@prisma/client';
import prisma from '../../config/database';

export class UserRepository {
  /**
   * Find a user profile in the database by their unique ID.
   * @param id The database user uuid.
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user profile in the database by their unique phone number.
   * @param phone The unique phone number.
   */
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Updates partial data on a user record.
   * @param id The database user uuid.
   * @param data The updated data fields.
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}

export default UserRepository;

