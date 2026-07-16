-- Add missing donor fields to users table
ALTER TABLE `users` ADD COLUMN `totalDonatedVND` INT NOT NULL DEFAULT 0;
ALTER TABLE `users` ADD COLUMN `donorTier` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `donorSince` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `showOnDonorWall` TINYINT(1) NOT NULL DEFAULT 1;
