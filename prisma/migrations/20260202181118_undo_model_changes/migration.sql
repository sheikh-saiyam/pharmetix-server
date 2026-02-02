/*
  Warnings:

  - You are about to alter the column `price` on the `medicines` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `piecePrice` on the `medicines` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "medicines" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "piecePrice" SET DATA TYPE DOUBLE PRECISION;
