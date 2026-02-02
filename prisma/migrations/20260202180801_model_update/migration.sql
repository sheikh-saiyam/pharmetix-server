/*
  Warnings:

  - You are about to alter the column `price` on the `medicines` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `piecePrice` on the `medicines` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "medicines" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "piecePrice" SET DATA TYPE DECIMAL(65,30);
