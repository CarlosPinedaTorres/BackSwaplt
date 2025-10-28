/*
  Warnings:

  - A unique constraint covering the columns `[lastMessageId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `lastMessageId` INTEGER NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `Chat_lastMessageId_key` ON `Chat`(`lastMessageId`);

-- CreateIndex
CREATE INDEX `Chat_user1Id_idx` ON `Chat`(`user1Id`);

-- CreateIndex
CREATE INDEX `Chat_updatedAt_idx` ON `Chat`(`updatedAt`);

-- CreateIndex
CREATE INDEX `Message_createdAt_idx` ON `Message`(`createdAt`);

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_lastMessageId_fkey` FOREIGN KEY (`lastMessageId`) REFERENCES `Message`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Chat` RENAME INDEX `Chat_user2Id_fkey` TO `Chat_user2Id_idx`;

-- RenameIndex
ALTER TABLE `Message` RENAME INDEX `Message_chatId_fkey` TO `Message_chatId_idx`;
