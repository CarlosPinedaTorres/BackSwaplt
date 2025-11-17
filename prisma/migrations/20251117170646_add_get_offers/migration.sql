/*
  Warnings:

  - You are about to drop the `Offer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Offer` DROP FOREIGN KEY `Offer_offererId_fkey`;

-- DropForeignKey
ALTER TABLE `Offer` DROP FOREIGN KEY `Offer_productRequestedId_fkey`;

-- DropForeignKey
ALTER TABLE `Offer` DROP FOREIGN KEY `Offer_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `OfferProduct` DROP FOREIGN KEY `OfferProduct_offerId_fkey`;

-- DropForeignKey
ALTER TABLE `OfferProduct` DROP FOREIGN KEY `OfferProduct_productId_fkey`;

-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_buyerId_fkey`;

-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_productId_fkey`;

-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_sellerId_fkey`;

-- DropTable
DROP TABLE `Offer`;

-- DropTable
DROP TABLE `OfferProduct`;

-- DropTable
DROP TABLE `Transaction`;

-- CreateTable
CREATE TABLE `Operation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requesterId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `mainProductId` INTEGER NOT NULL,
    `type` ENUM('SALE', 'TRADE', 'MIXED') NOT NULL,
    `moneyOffered` DOUBLE NULL,
    `isDirectPurchase` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `stripePaymentIntentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Operation_requesterId_idx`(`requesterId`),
    INDEX `Operation_receiverId_idx`(`receiverId`),
    INDEX `Operation_mainProductId_idx`(`mainProductId`),
    INDEX `Operation_status_idx`(`status`),
    INDEX `Operation_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OperationProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operationId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,

    UNIQUE INDEX `OperationProduct_operationId_productId_key`(`operationId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Operation` ADD CONSTRAINT `Operation_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Operation` ADD CONSTRAINT `Operation_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Operation` ADD CONSTRAINT `Operation_mainProductId_fkey` FOREIGN KEY (`mainProductId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationProduct` ADD CONSTRAINT `OperationProduct_operationId_fkey` FOREIGN KEY (`operationId`) REFERENCES `Operation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationProduct` ADD CONSTRAINT `OperationProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
