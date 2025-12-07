/*
  Warnings:

  - The values [MIXED] on the enum `Operation_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Operation` DROP FOREIGN KEY `Operation_mainProductId_fkey`;

-- AlterTable
ALTER TABLE `Operation` MODIFY `type` ENUM('SALE', 'TRADE') NOT NULL;

-- AddForeignKey
ALTER TABLE `Operation` ADD CONSTRAINT `Operation_mainProductId_fkey` FOREIGN KEY (`mainProductId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
