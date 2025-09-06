/*
  Warnings:

  - Made the column `paymentMethod` on table `donations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `donations` ADD COLUMN `bankCode` VARCHAR(191) NULL,
    ADD COLUMN `kofiTransactionId` VARCHAR(191) NULL,
    ADD COLUMN `qrCodeUrl` VARCHAR(191) NULL,
    ADD COLUMN `transferNote` VARCHAR(191) NULL,
    MODIFY `paymentMethod` ENUM('KOFI', 'BANK_TRANSFER', 'MANUAL') NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE INDEX `donations_paymentMethod_idx` ON `donations`(`paymentMethod`);

-- CreateIndex
CREATE INDEX `donations_kofiTransactionId_idx` ON `donations`(`kofiTransactionId`);
