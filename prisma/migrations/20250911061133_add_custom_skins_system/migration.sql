-- CreateTable
CREATE TABLE `champions` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `alias` VARCHAR(191) NOT NULL,
    `contentId` VARCHAR(191) NOT NULL,
    `squarePortraitPath` VARCHAR(191) NOT NULL,
    `roles` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `champions_alias_idx`(`alias`),
    INDEX `champions_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skin_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `skin_categories_name_key`(`name`),
    UNIQUE INDEX `skin_categories_slug_key`(`slug`),
    INDEX `skin_categories_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `custom_skins` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `championId` INTEGER NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` VARCHAR(191) NOT NULL,
    `fileType` ENUM('ZIP', 'RAR', 'FANTOME') NOT NULL,
    `previewImages` LONGTEXT NULL,
    `thumbnailImage` VARCHAR(191) NULL,
    `status` ENUM('APPROVED', 'FEATURED', 'HIDDEN') NOT NULL DEFAULT 'APPROVED',
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `custom_skins_championId_idx`(`championId`),
    INDEX `custom_skins_categoryId_idx`(`categoryId`),
    INDEX `custom_skins_authorId_idx`(`authorId`),
    INDEX `custom_skins_status_idx`(`status`),
    INDEX `custom_skins_createdAt_idx`(`createdAt`),
    FULLTEXT INDEX `custom_skins_name_description_idx`(`name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skin_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `championId` INTEGER NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `submitterId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` VARCHAR(191) NOT NULL,
    `fileType` ENUM('ZIP', 'RAR', 'FANTOME') NOT NULL,
    `previewImages` LONGTEXT NULL,
    `thumbnailImage` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION') NOT NULL DEFAULT 'PENDING',
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `adminNotes` TEXT NULL,
    `feedbackMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `skin_submissions_championId_idx`(`championId`),
    INDEX `skin_submissions_categoryId_idx`(`categoryId`),
    INDEX `skin_submissions_submitterId_idx`(`submitterId`),
    INDEX `skin_submissions_reviewedById_idx`(`reviewedById`),
    INDEX `skin_submissions_status_idx`(`status`),
    INDEX `skin_submissions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skin_downloads` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `skinId` VARCHAR(191) NOT NULL,
    `downloadIp` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `skin_downloads_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `skin_downloads_skinId_createdAt_idx`(`skinId`, `createdAt`),
    INDEX `skin_downloads_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `custom_skins` ADD CONSTRAINT `custom_skins_championId_fkey` FOREIGN KEY (`championId`) REFERENCES `champions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_skins` ADD CONSTRAINT `custom_skins_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `skin_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_skins` ADD CONSTRAINT `custom_skins_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skin_submissions` ADD CONSTRAINT `skin_submissions_championId_fkey` FOREIGN KEY (`championId`) REFERENCES `champions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skin_submissions` ADD CONSTRAINT `skin_submissions_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `skin_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skin_submissions` ADD CONSTRAINT `skin_submissions_submitterId_fkey` FOREIGN KEY (`submitterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skin_submissions` ADD CONSTRAINT `skin_submissions_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skin_downloads` ADD CONSTRAINT `skin_downloads_skinId_fkey` FOREIGN KEY (`skinId`) REFERENCES `custom_skins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `skin_downloads` ADD CONSTRAINT `skin_downloads_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
