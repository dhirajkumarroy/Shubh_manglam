import { Vehicle, VehicleCategory, VehicleStatus } from '@prisma/client';
import prisma from '../../config/database';

export class LocationService {
  /**
   * Calculates the distance between two GPS coordinates using the Haversine formula.
   * Returns distance in kilometers.
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Queries nearby vehicles of a specified category whose operating area covers the pickup point.
   */
  async findNearbyVehicles(
    pickupLat: number,
    pickupLng: number,
    category: VehicleCategory
  ): Promise<Vehicle[]> {
    // 1. Fetch active, available vehicles of matching category that have operating coordinate parameters configured.
    const activeVehicles = await prisma.vehicle.findMany({
      where: {
        category,
        status: VehicleStatus.ACTIVE,
        isAvailable: true,
        NOT: {
          operatingLatitude: null,
          operatingLongitude: null,
        },
      },
    });

    // 2. Filter vehicles where distance to pickup point is within their operating zone radius bounds
    return activeVehicles.filter((vehicle) => {
      if (
        vehicle.operatingLatitude === null ||
        vehicle.operatingLongitude === null ||
        vehicle.operatingRadius === null
      ) {
        return false;
      }

      const distance = this.calculateDistance(
        pickupLat,
        pickupLng,
        vehicle.operatingLatitude,
        vehicle.operatingLongitude
      );

      return distance <= vehicle.operatingRadius;
    });
  }
}

export const locationService = new LocationService();
