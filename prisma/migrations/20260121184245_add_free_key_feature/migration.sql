-- AlterTable
ALTER TABLE `products` ADD COLUMN `adBypassEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `freeKeyPlanId` VARCHAR(191) NULL,
    ADD COLUMN `requiresKey` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `images` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `banners` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `linkUrl` VARCHAR(191) NULL,
    `linkText` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `backgroundColor` VARCHAR(191) NULL,
    `textColor` VARCHAR(191) NULL,
    `type` ENUM('INFO', 'LIVESTREAM', 'PROMOTION', 'WARNING', 'SUCCESS', 'EVENT') NOT NULL DEFAULT 'INFO',
    `position` ENUM('TOP', 'BOTTOM', 'MODAL') NOT NULL DEFAULT 'TOP',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDismissible` BOOLEAN NOT NULL DEFAULT true,
    `showOnMobile` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `targetAudience` ENUM('ALL', 'AUTHENTICATED', 'GUEST') NOT NULL DEFAULT 'ALL',
    `appVisible` BOOLEAN NOT NULL DEFAULT true,
    `appData` TEXT NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `clickCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `banners_isActive_startDate_endDate_idx`(`isActive`, `startDate`, `endDate`),
    INDEX `banners_priority_idx`(`priority`),
    INDEX `banners_type_idx`(`type`),
    INDEX `banners_position_idx`(`position`),
    INDEX `banners_appVisible_idx`(`appVisible`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `descriptionEn` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `comparePrice` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'VND',
    `priceUsd` DECIMAL(10, 2) NULL,
    `comparePriceUsd` DECIMAL(10, 2) NULL,
    `durationType` ENUM('HOUR', 'DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'LIFETIME') NOT NULL DEFAULT 'MONTH',
    `durationValue` INTEGER NOT NULL DEFAULT 1,
    `features` TEXT NULL,
    `featuresEn` TEXT NULL,
    `maxDevices` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `color` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `subscription_plans_slug_key`(`slug`),
    INDEX `subscription_plans_slug_idx`(`slug`),
    INDEX `subscription_plans_isActive_priority_idx`(`isActive`, `priority`),
    INDEX `subscription_plans_durationType_idx`(`durationType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `license_keys` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NOT NULL,
    `status` ENUM('INACTIVE', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'BANNED') NOT NULL DEFAULT 'INACTIVE',
    `activatedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `maxDevices` INTEGER NOT NULL DEFAULT 1,
    `currentDevices` INTEGER NOT NULL DEFAULT 0,
    `lastUsedAt` DATETIME(3) NULL,
    `lastUsedIp` VARCHAR(191) NULL,
    `lastHwid` VARCHAR(191) NULL,
    `totalActivations` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `license_keys_key_key`(`key`),
    INDEX `license_keys_key_idx`(`key`),
    INDEX `license_keys_userId_idx`(`userId`),
    INDEX `license_keys_planId_idx`(`planId`),
    INDEX `license_keys_status_idx`(`status`),
    INDEX `license_keys_expiresAt_idx`(`expiresAt`),
    INDEX `license_keys_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `key_activations` (
    `id` VARCHAR(191) NOT NULL,
    `keyId` VARCHAR(191) NOT NULL,
    `hwid` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NULL,
    `deviceInfo` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'DEACTIVATED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `activatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deactivatedAt` DATETIME(3) NULL,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `key_activations_keyId_idx`(`keyId`),
    INDEX `key_activations_hwid_idx`(`hwid`),
    INDEX `key_activations_status_idx`(`status`),
    INDEX `key_activations_lastSeenAt_idx`(`lastSeenAt`),
    UNIQUE INDEX `key_activations_keyId_hwid_key`(`keyId`, `hwid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `key_usage_logs` (
    `id` VARCHAR(191) NOT NULL,
    `keyId` VARCHAR(191) NOT NULL,
    `action` ENUM('VALIDATE', 'ACTIVATE', 'DEACTIVATE', 'HEARTBEAT', 'LOGIN', 'RESET_HWID', 'EXTEND', 'SUSPEND', 'REVOKE') NOT NULL,
    `hwid` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `key_usage_logs_keyId_createdAt_idx`(`keyId`, `createdAt`),
    INDEX `key_usage_logs_action_idx`(`action`),
    INDEX `key_usage_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NOT NULL,
    `keyId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `finalAmount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'VND',
    `paymentMethod` ENUM('BANK_TRANSFER', 'MOMO', 'VNPAY', 'ZALOPAY', 'PAYPAL', 'CRYPTO', 'MANUAL') NOT NULL DEFAULT 'BANK_TRANSFER',
    `paymentStatus` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `transactionId` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `couponCode` VARCHAR(191) NULL,
    `couponDiscount` DECIMAL(10, 2) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `customerNote` TEXT NULL,
    `adminNote` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `orders_keyId_key`(`keyId`),
    INDEX `orders_orderNumber_idx`(`orderNumber`),
    INDEX `orders_userId_idx`(`userId`),
    INDEX `orders_planId_idx`(`planId`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_paymentStatus_idx`(`paymentStatus`),
    INDEX `orders_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `free_key_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CLAIMED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `licenseKeyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `claimedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `free_key_sessions_token_key`(`token`),
    UNIQUE INDEX `free_key_sessions_licenseKeyId_key`(`licenseKeyId`),
    INDEX `free_key_sessions_token_idx`(`token`),
    INDEX `free_key_sessions_productId_idx`(`productId`),
    INDEX `free_key_sessions_userId_idx`(`userId`),
    INDEX `free_key_sessions_ipAddress_idx`(`ipAddress`),
    INDEX `free_key_sessions_status_idx`(`status`),
    INDEX `free_key_sessions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_freeKeyPlanId_fkey` FOREIGN KEY (`freeKeyPlanId`) REFERENCES `subscription_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `license_keys` ADD CONSTRAINT `license_keys_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `license_keys` ADD CONSTRAINT `license_keys_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `key_activations` ADD CONSTRAINT `key_activations_keyId_fkey` FOREIGN KEY (`keyId`) REFERENCES `license_keys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `key_usage_logs` ADD CONSTRAINT `key_usage_logs_keyId_fkey` FOREIGN KEY (`keyId`) REFERENCES `license_keys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_keyId_fkey` FOREIGN KEY (`keyId`) REFERENCES `license_keys`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `free_key_sessions` ADD CONSTRAINT `free_key_sessions_licenseKeyId_fkey` FOREIGN KEY (`licenseKeyId`) REFERENCES `license_keys`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `free_key_sessions` ADD CONSTRAINT `free_key_sessions_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `free_key_sessions` ADD CONSTRAINT `free_key_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
