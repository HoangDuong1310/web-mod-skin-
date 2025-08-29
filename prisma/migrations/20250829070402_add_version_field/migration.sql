/*
  Warnings:

  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `userId` on table `downloads` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `downloads` DROP FOREIGN KEY `downloads_userId_fkey`;

-- AlterTable
ALTER TABLE `downloads` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `version` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `settings`;

-- AddForeignKey
ALTER TABLE `downloads` ADD CONSTRAINT `downloads_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
