-- CreateTable
CREATE TABLE `caixas` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('ABERTO', 'FECHADO') NOT NULL DEFAULT 'ABERTO',
    `valorAbertura` DECIMAL(10, 2) NOT NULL,
    `valorFechamento` DECIMAL(10, 2) NULL,
    `observacoesAbertura` TEXT NULL,
    `observacoesFechamento` TEXT NULL,
    `abertoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechadoEm` DATETIME(3) NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `usuarioAberturaId` VARCHAR(191) NOT NULL,
    `usuarioFechamentoId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimentacoes_caixa` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('SANGRIA', 'SUPRIMENTO') NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `caixaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `caixas` ADD CONSTRAINT `caixas_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caixas` ADD CONSTRAINT `caixas_usuarioAberturaId_fkey` FOREIGN KEY (`usuarioAberturaId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caixas` ADD CONSTRAINT `caixas_usuarioFechamentoId_fkey` FOREIGN KEY (`usuarioFechamentoId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes_caixa` ADD CONSTRAINT `movimentacoes_caixa_caixaId_fkey` FOREIGN KEY (`caixaId`) REFERENCES `caixas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes_caixa` ADD CONSTRAINT `movimentacoes_caixa_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
