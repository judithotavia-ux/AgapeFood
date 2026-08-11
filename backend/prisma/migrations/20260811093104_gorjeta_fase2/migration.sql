-- CreateTable
CREATE TABLE `configuracoes_gorjeta` (
    `id` VARCHAR(191) NOT NULL,
    `ativa` BOOLEAN NOT NULL DEFAULT false,
    `percentualPadrao` DECIMAL(5, 2) NOT NULL DEFAULT 10,
    `permitirClienteEscolher` BOOLEAN NOT NULL DEFAULT true,
    `opcoesPercentual` VARCHAR(191) NOT NULL DEFAULT '[5,10,12,15]',
    `permitirValorFixo` BOOLEAN NOT NULL DEFAULT false,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `configuracoes_gorjeta_empresaId_key`(`empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `configuracoes_gorjeta` ADD CONSTRAINT `configuracoes_gorjeta_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

