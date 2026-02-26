-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'STAFF', 'RESELLER', 'USER') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `review_replies` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `review_replies_reviewId_idx`(`reviewId`),
    INDEX `review_replies_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_filters` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL DEFAULT 'block',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `matchCount` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `review_filters_type_idx`(`type`),
    INDEX `review_filters_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resellers` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `website` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED', 'BANNED') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `rejectedReason` TEXT NULL,
    `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalSpent` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'VND',
    `discountPercent` INTEGER NOT NULL DEFAULT 0,
    `freeKeyQuotaDaily` INTEGER NOT NULL DEFAULT 0,
    `freeKeyQuotaMonthly` INTEGER NOT NULL DEFAULT 0,
    `freeKeyPlanId` VARCHAR(191) NULL,
    `maxKeysPerOrder` INTEGER NOT NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `resellers_userId_key`(`userId`),
    INDEX `resellers_userId_idx`(`userId`),
    INDEX `resellers_status_idx`(`status`),
    INDEX `resellers_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reseller_api_keys` (
    `id` VARCHAR(191) NOT NULL,
    `resellerId` VARCHAR(191) NOT NULL,
    `apiKey` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `lastUsedIp` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NULL,
    `rateLimit` INTEGER NOT NULL DEFAULT 60,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reseller_api_keys_apiKey_key`(`apiKey`),
    INDEX `reseller_api_keys_apiKey_idx`(`apiKey`),
    INDEX `reseller_api_keys_resellerId_idx`(`resellerId`),
    INDEX `reseller_api_keys_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reseller_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `resellerId` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'PURCHASE_KEY', 'REFUND', 'ADJUSTMENT', 'BONUS') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `balanceBefore` DECIMAL(12, 2) NOT NULL,
    `balanceAfter` DECIMAL(12, 2) NOT NULL,
    `description` TEXT NULL,
    `reference` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NULL,
    `quantity` INTEGER NULL,
    `unitPrice` DECIMAL(10, 2) NULL,
    `discount` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    INDEX `reseller_transactions_resellerId_createdAt_idx`(`resellerId`, `createdAt`),
    INDEX `reseller_transactions_type_idx`(`type`),
    INDEX `reseller_transactions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reseller_key_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `resellerId` VARCHAR(191) NOT NULL,
    `licenseKeyId` VARCHAR(191) NOT NULL,
    `type` ENUM('PURCHASED', 'FREE') NOT NULL DEFAULT 'PURCHASED',
    `allocatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reseller_key_allocations_resellerId_allocatedAt_idx`(`resellerId`, `allocatedAt`),
    INDEX `reseller_key_allocations_licenseKeyId_idx`(`licenseKeyId`),
    INDEX `reseller_key_allocations_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `review_replies` ADD CONSTRAINT `review_replies_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_replies` ADD CONSTRAINT `review_replies_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resellers` ADD CONSTRAINT `resellers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resellers` ADD CONSTRAINT `resellers_freeKeyPlanId_fkey` FOREIGN KEY (`freeKeyPlanId`) REFERENCES `subscription_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reseller_api_keys` ADD CONSTRAINT `reseller_api_keys_resellerId_fkey` FOREIGN KEY (`resellerId`) REFERENCES `resellers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reseller_transactions` ADD CONSTRAINT `reseller_transactions_resellerId_fkey` FOREIGN KEY (`resellerId`) REFERENCES `resellers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reseller_key_allocations` ADD CONSTRAINT `reseller_key_allocations_resellerId_fkey` FOREIGN KEY (`resellerId`) REFERENCES `resellers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reseller_key_allocations` ADD CONSTRAINT `reseller_key_allocations_licenseKeyId_fkey` FOREIGN KEY (`licenseKeyId`) REFERENCES `license_keys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
