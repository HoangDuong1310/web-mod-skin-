-- DropForeignKey
ALTER TABLE `downloads` DROP FOREIGN KEY `downloads_userId_fkey`;

-- AlterTable
ALTER TABLE `downloads` MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `downloadUrl` VARCHAR(191) NULL,
    ADD COLUMN `externalUrl` VARCHAR(191) NULL,
    ADD COLUMN `fileSize` VARCHAR(191) NULL,
    ADD COLUMN `filename` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NULL,
    `category` VARCHAR(191) NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    INDEX `settings_category_idx`(`category`),
    INDEX `settings_key_category_idx`(`key`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `downloads` ADD CONSTRAINT `downloads_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
