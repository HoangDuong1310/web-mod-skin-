-- DropForeignKey
ALTER TABLE `downloads` DROP FOREIGN KEY `downloads_userId_fkey`;

-- AlterTable
ALTER TABLE `downloads` MODIFY `userId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `downloads` ADD CONSTRAINT `downloads_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
