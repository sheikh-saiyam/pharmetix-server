/*
  Warnings:

  - Added the required column `shippingCity` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingPostalCode` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippingCity" TEXT NOT NULL,
ADD COLUMN     "shippingPostalCode" TEXT NOT NULL;
