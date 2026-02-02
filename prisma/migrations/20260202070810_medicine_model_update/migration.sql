/*
  Warnings:

  - Added the required column `dosageForm` to the `medicines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packSize` to the `medicines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strength` to the `medicines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `medicines` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DosageForm" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP', 'SUSPENSION', 'DROPS', 'CREAM', 'OINTMENT');

-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "dosageForm" "DosageForm" NOT NULL,
ADD COLUMN     "dosageInfo" TEXT,
ADD COLUMN     "packSize" INTEGER NOT NULL,
ADD COLUMN     "piecePrice" DOUBLE PRECISION,
ADD COLUMN     "strength" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;
