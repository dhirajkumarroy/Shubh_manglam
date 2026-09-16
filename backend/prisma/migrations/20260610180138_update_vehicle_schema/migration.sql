/*
  Warnings:

  - You are about to drop the column `publicId` on the `vehicle_images` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `vehicle_images` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `vehicles` table. All the data in the column will be lost.
  - Added the required column `imageUrl` to the `vehicle_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fuelType` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seatCapacity` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transmission` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "vehicle_images" DROP COLUMN "publicId",
DROP COLUMN "url",
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "name",
DROP COLUMN "vehicleType",
ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "fuelType" "FuelType" NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "seatCapacity" INTEGER NOT NULL,
ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "transmission" "Transmission" NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "vehicles_city_idx" ON "vehicles"("city");

-- CreateIndex
CREATE INDEX "vehicles_brand_idx" ON "vehicles"("brand");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_isAvailable_idx" ON "vehicles"("isAvailable");

-- CreateIndex
CREATE INDEX "vehicles_pricePerDay_idx" ON "vehicles"("pricePerDay");
