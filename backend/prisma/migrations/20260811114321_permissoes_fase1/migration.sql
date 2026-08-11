-- CreateTable
CREATE TABLE `permissoes` (
    `id` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `modulo` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissoes_chave_key`(`chave`),
    INDEX `permissoes_modulo_idx`(`modulo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfis_permissao_padrao` (
    `id` VARCHAR(191) NOT NULL,
    `papel` ENUM('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'FUNCIONARIO', 'GARCOM') NOT NULL,
    `permissaoId` VARCHAR(191) NOT NULL,

    INDEX `perfis_permissao_padrao_papel_idx`(`papel`),
    UNIQUE INDEX `perfis_permissao_padrao_papel_permissaoId_key`(`papel`, `permissaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `perfis_permissao_padrao` ADD CONSTRAINT `perfis_permissao_padrao_permissaoId_fkey` FOREIGN KEY (`permissaoId`) REFERENCES `permissoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

