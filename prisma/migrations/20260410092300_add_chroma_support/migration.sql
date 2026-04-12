-- AlterTable: Add chroma support to league_skins
ALTER TABLE `league_skins` ADD COLUMN `parentSkinId` INTEGER NULL;
ALTER TABLE `league_skins` ADD COLUMN `isChroma` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `league_skins_parentSkinId_idx` ON `league_skins`(`parentSkinId`);

-- AddForeignKey
ALTER TABLE `league_skins` ADD CONSTRAINT `league_skins_parentSkinId_fkey` FOREIGN KEY (`parentSkinId`) REFERENCES `league_skins`(`skinId`) ON DELETE SET NULL ON UPDATE CASCADE;
