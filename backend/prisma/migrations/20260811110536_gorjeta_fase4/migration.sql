-- AlterTable
ALTER TABLE `configuracoes_gorjeta` ADD COLUMN `atualizadoPorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `configuracoes_gorjeta` ADD CONSTRAINT `configuracoes_gorjeta_atualizadoPorId_fkey` FOREIGN KEY (`atualizadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

