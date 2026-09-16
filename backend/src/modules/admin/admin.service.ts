import { VehicleStatus, User, Vehicle } from '@prisma/client';
import { AdminRepository } from './admin.repository';
import { NotificationService } from '../notifications/notification.service';
import { UserQueryDto, VehicleQueryDto, BookingQueryDto } from './admin.types';
import { NotFoundError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class AdminService {
  private adminRepository: AdminRepository;
  private notificationService: NotificationService;

  constructor() {
    this.adminRepository = new AdminRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Retrieves dashboard statistics.
   */
  async getDashboardStats() {
    logger.info('AdminService: Fetching dashboard stats');
    return this.adminRepository.getDashboardStats();
  }

  /**
   * Retrieves users list.
   */
  async listUsers(dto: UserQueryDto) {
    logger.info(`AdminService: Listing users (page: ${dto.page}, limit: ${dto.limit})`);
    const { total, users } = await this.adminRepository.listUsers(dto);
    const totalPages = Math.ceil(total / dto.limit);

    return {
      pagination: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages,
      },
      users,
    };
  }

  /**
   * Retrieves user details.
   */
  async getUserDetails(id: string) {
    logger.info(`AdminService: Fetching user details for ID: ${id}`);
    const user = await this.adminRepository.getUserById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return user;
  }

  /**
   * Blocks a user and triggers a notification.
   */
  async blockUser(id: string): Promise<Omit<User, 'password'>> {
    logger.info(`AdminService: Blocking user ID: ${id}`);
    const userExists = await this.adminRepository.getUserById(id);
    if (!userExists) {
      throw new NotFoundError('User not found.');
    }

    const updatedUser = await this.adminRepository.updateUserBlockStatus(id, true);

    // Send SYSTEM notification to the blocked user
    this.notificationService.createNotification(id, {
      title: 'Account Blocked',
      message: 'Your account has been blocked by an administrator.',
      type: 'SYSTEM',
    }).catch((err) => logger.error(`Failed to trigger block notification for user ${id}`, err));

    return updatedUser;
  }

  /**
   * Unblocks a user.
   */
  async unblockUser(id: string): Promise<Omit<User, 'password'>> {
    logger.info(`AdminService: Unblocking user ID: ${id}`);
    const userExists = await this.adminRepository.getUserById(id);
    if (!userExists) {
      throw new NotFoundError('User not found.');
    }

    return this.adminRepository.updateUserBlockStatus(id, false);
  }

  /**
   * Retrieves vehicles list.
   */
  async listVehicles(dto: VehicleQueryDto) {
    logger.info(`AdminService: Listing vehicles (page: ${dto.page}, limit: ${dto.limit})`);
    const { total, vehicles } = await this.adminRepository.listVehicles(dto);
    const totalPages = Math.ceil(total / dto.limit);

    return {
      pagination: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages,
      },
      vehicles,
    };
  }

  /**
   * Retrieves vehicle details.
   */
  async getVehicleDetails(id: string) {
    logger.info(`AdminService: Fetching vehicle details for ID: ${id}`);
    const vehicle = await this.adminRepository.getVehicleById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found.');
    }
    return vehicle;
  }

  /**
   * Approves a vehicle and triggers a notification.
   */
  async approveVehicle(id: string): Promise<Vehicle> {
    logger.info(`AdminService: Approving vehicle ID: ${id}`);
    const vehicle = await this.adminRepository.getVehicleById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found.');
    }

    const updatedVehicle = await this.adminRepository.updateVehicleStatus(id, VehicleStatus.ACTIVE);

    // Send SYSTEM notification to the vehicle owner
    this.notificationService.createNotification(vehicle.ownerId, {
      title: 'Vehicle Approved',
      message: `Your vehicle listing "${vehicle.title}" has been approved.`,
      type: 'SYSTEM',
    }).catch((err) => logger.error(`Failed to trigger approve notification for vehicle ${id}`, err));

    return updatedVehicle;
  }

  /**
   * Rejects a vehicle and triggers a notification.
   */
  async rejectVehicle(id: string): Promise<Vehicle> {
    logger.info(`AdminService: Rejecting vehicle ID: ${id}`);
    const vehicle = await this.adminRepository.getVehicleById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found.');
    }

    const updatedVehicle = await this.adminRepository.updateVehicleStatus(id, VehicleStatus.REJECTED);

    // Send SYSTEM notification to the vehicle owner
    this.notificationService.createNotification(vehicle.ownerId, {
      title: 'Vehicle Rejected',
      message: `Your vehicle listing "${vehicle.title}" has been rejected.`,
      type: 'SYSTEM',
    }).catch((err) => logger.error(`Failed to trigger reject notification for vehicle ${id}`, err));

    return updatedVehicle;
  }

  /**
   * Suspends a vehicle.
   */
  async suspendVehicle(id: string): Promise<Vehicle> {
    logger.info(`AdminService: Suspending vehicle ID: ${id}`);
    const vehicle = await this.adminRepository.getVehicleById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found.');
    }

    return this.adminRepository.updateVehicleStatus(id, VehicleStatus.SUSPENDED);
  }

  /**
   * Retrieves bookings list.
   */
  async listBookings(dto: BookingQueryDto) {
    logger.info(`AdminService: Listing bookings (page: ${dto.page}, limit: ${dto.limit})`);
    const { total, bookings } = await this.adminRepository.listBookings(dto);
    const totalPages = Math.ceil(total / dto.limit);

    return {
      pagination: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages,
      },
      bookings,
    };
  }

  /**
   * Retrieves booking details.
   */
  async getBookingDetails(id: string) {
    logger.info(`AdminService: Fetching booking details for ID: ${id}`);
    const booking = await this.adminRepository.getBookingById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }
    return booking;
  }
}

export default AdminService;
