-- CreateTable
CREATE TABLE `permissoes_temporarias` (
    `id` VARCHAR(191) NOT NULL,
    `validaAte` DATETIME(3) NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revogadaEm` DATETIME(3) NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `permissaoId` VARCHAR(191) NOT NULL,
    `concedidaPorId` VARCHAR(191) NOT NULL,

    INDEX `permissoes_temporarias_usuarioId_revogadaEm_validaAte_idx`(`usuarioId`, `revogadaEm`, `validaAte`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `permissoes_temporarias` ADD CONSTRAINT `permissoes_temporarias_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_temporarias` ADD CONSTRAINT `permissoes_temporarias_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_temporarias` ADD CONSTRAINT `permissoes_temporarias_permissaoId_fkey` FOREIGN KEY (`permissaoId`) REFERENCES `permissoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissoes_temporarias` ADD CONSTRAINT `permissoes_temporarias_concedidaPorId_fkey` FOREIGN KEY (`concedidaPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

