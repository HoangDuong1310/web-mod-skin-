-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS') NOT NULL DEFAULT 'INFO',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `targetAudience` ENUM('ALL', 'AUTHENTICATED', 'GUEST') NOT NULL DEFAULT 'ALL',
    `position` ENUM('TOP', 'BOTTOM') NOT NULL DEFAULT 'TOP',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `dismissible` BOOLEAN NOT NULL DEFAULT true,
    `linkUrl` VARCHAR(191) NULL,
    `linkText` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `notifications_isActive_startDate_endDate_idx`(`isActive`, `startDate`, `endDate`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_priority_idx`(`priority`),
    INDEX `notifications_createdById_idx`(`createdById`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;