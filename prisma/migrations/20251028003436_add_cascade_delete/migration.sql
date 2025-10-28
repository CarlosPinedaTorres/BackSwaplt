-- DropForeignKey
ALTER TABLE `Chat` DROP FOREIGN KEY `Chat_productId_fkey`;

-- DropForeignKey
ALTER TABLE `Foto` DROP FOREIGN KEY `Foto_productoId_fkey`;

-- DropIndex
DROP INDEX `Chat_productId_fkey` ON `Chat`;

-- DropIndex
DROP INDEX `Foto_productoId_fkey` ON `Foto`;

-- AddForeignKey
ALTER TABLE `Foto` ADD CONSTRAINT `Foto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
