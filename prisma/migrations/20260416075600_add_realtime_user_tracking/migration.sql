-- CreateTable
CREATE TABLE `active_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `license_key` VARCHAR(191) NOT NULL,
    `hwid` VARCHAR(191) NOT NULL,
    `app_version` VARCHAR(191) NULL,
    `phase` VARCHAR(191) NULL,
    `game_mode` VARCHAR(191) NULL,
    `champion` VARCHAR(191) NULL,
    `champion_id` INTEGER NULL,
    `skin` VARCHAR(191) NULL,
    `skin_id` INTEGER NULL,
    `summoner_name` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `party_mode` BOOLEAN NOT NULL DEFAULT false,
    `uptime_minutes` INTEGER NOT NULL DEFAULT 0,
    `injection_count` INTEGER NOT NULL DEFAULT 0,
    `last_injection_skin` VARCHAR(191) NULL,
    `session_start` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_heartbeat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `active_sessions_license_key_hwid_key`(`license_key`, `hwid`),
    INDEX `active_sessions_last_heartbeat_idx`(`last_heartbeat`),
    INDEX `active_sessions_phase_idx`(`phase`),
    INDEX `active_sessions_region_idx`(`region`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `license_key` VARCHAR(191) NOT NULL,
    `hwid` VARCHAR(191) NOT NULL,
    `summoner_name` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `session_start` DATETIME(3) NOT NULL,
    `session_end` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 0,
    `injection_count` INTEGER NOT NULL DEFAULT 0,
    `app_version` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `session_history_license_key_idx`(`license_key`),
    INDEX `session_history_session_end_idx`(`session_end`),
    INDEX `session_history_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
