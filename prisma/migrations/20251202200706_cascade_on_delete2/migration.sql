-- DropForeignKey
ALTER TABLE `OperationProduct` DROP FOREIGN KEY `OperationProduct_productId_fkey`;

-- DropIndex
DROP INDEX `OperationProduct_productId_fkey` ON `OperationProduct`;

-- AddForeignKey
ALTER TABLE `OperationProduct` ADD CONSTRAINT `OperationProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
