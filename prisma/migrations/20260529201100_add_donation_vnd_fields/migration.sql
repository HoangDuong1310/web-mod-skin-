-- Add VND donation fields and verification metadata
ALTER TABLE `donations`
  ADD COLUMN `amountVND` INT NOT NULL DEFAULT 0,
  ADD COLUMN `verifiedAt` DATETIME(3) NULL,
  ADD COLUMN `bankTxId` VARCHAR(191) NULL,
  ADD COLUMN `tierAtTime` VARCHAR(191) NULL;

-- Unique index for bank transaction id (sparse via NULL)
CREATE UNIQUE INDEX `donations_bankTxId_key` ON `donations`(`bankTxId`);

-- Extend DonationStatus enum to include VERIFIED and EXPIRED
ALTER TABLE `donations`
  MODIFY COLUMN `status` ENUM('PENDING','COMPLETED','VERIFIED','EXPIRED','FAILED','REFUNDED','CANCELLED') NOT NULL DEFAULT 'PENDING';
