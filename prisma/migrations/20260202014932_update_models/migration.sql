/*
  Warnings:

  - A unique constraint covering the columns `[sellerId,slug]` on the table `medicines` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId,medicineId,customerId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "medicines" DROP CONSTRAINT "medicines_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_customerId_fkey";

-- DropIndex
DROP INDEX "medicines_slug_key";

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "medicines_sellerId_slug_key" ON "medicines"("sellerId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderId_medicineId_customerId_key" ON "reviews"("orderId", "medicineId", "customerId");

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
