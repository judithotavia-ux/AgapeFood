-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `perfilPersonalizadoId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `perfis_personalizados` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `perfis_personalizados_empresaId_nome_key`(`empresaId`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfis_personalizados_permissoes` (
    `id` VARCHAR(191) NOT NULL,
    `perfilId` VARCHAR(191) NOT NULL,
    `permissaoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `perfis_personalizados_permissoes_perfilId_permissaoId_key`(`perfilId`, `permissaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_perfilPersonalizadoId_fkey` FOREIGN KEY (`perfilPersonalizadoId`) REFERENCES `perfis_personalizados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfis_personalizados` ADD CONSTRAINT `perfis_personalizados_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfis_personalizados_permissoes` ADD CONSTRAINT `perfis_personalizados_permissoes_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `perfis_personalizados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfis_personalizados_permissoes` ADD CONSTRAINT `perfis_personalizados_permissoes_permissaoId_fkey` FOREIGN KEY (`permissaoId`) REFERENCES `permissoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

