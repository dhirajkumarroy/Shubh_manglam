import { AdminRepository } from './admin.repository';
import { NotificationService } from '../notifications/notification.service';
import { UserQueryDto } from './admin.types';
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
   * Retrieves dashboard statistics for Shubh Mangalam.
   */
  async getDashboardStats() {
    logger.info('AdminService: Fetching Shubh Mangalam dashboard stats');
    return this.adminRepository.getDashboardStats();
  }

  /**
   * Retrieves paginated users list.
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
  async blockUser(id: string) {
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
  async unblockUser(id: string) {
    logger.info(`AdminService: Unblocking user ID: ${id}`);
    const userExists = await this.adminRepository.getUserById(id);
    if (!userExists) {
      throw new NotFoundError('User not found.');
    }

    return this.adminRepository.updateUserBlockStatus(id, false);
  }
}

export default AdminService;
