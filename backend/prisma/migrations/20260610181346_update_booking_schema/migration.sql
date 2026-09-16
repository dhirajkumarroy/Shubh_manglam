/*
  Warnings:

  - You are about to drop the column `totalPrice` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `ownerId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDays` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'CONFIRMED';

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "totalPrice",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalDays" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "bookings_ownerId_idx" ON "bookings"("ownerId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
