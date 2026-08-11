-- AlterTable
ALTER TABLE `configuracoes_gorjeta` ADD COLUMN `modeloDistribuicao` ENUM('INDIVIDUAL', 'COLETIVO') NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN `regraRateio` ENUM('IGUAL', 'PERCENTUAL', 'HORAS', 'PONTOS') NOT NULL DEFAULT 'IGUAL';

-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `fechamentoGorjetaId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `percentualRateioGorjeta` DECIMAL(5, 2) NULL,
    ADD COLUMN `pontosGorjeta` INTEGER NULL;

-- CreateTable
CREATE TABLE `fechamentos_gorjeta` (
    `id` VARCHAR(191) NOT NULL,
    `periodoInicio` DATETIME(3) NOT NULL,
    `periodoFim` DATETIME(3) NOT NULL,
    `modeloDistribuicao` ENUM('INDIVIDUAL', 'COLETIVO') NOT NULL,
    `regraRateio` ENUM('IGUAL', 'PERCENTUAL', 'HORAS', 'PONTOS') NULL,
    `totalVendido` DECIMAL(12, 2) NOT NULL,
    `totalGorjetas` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('CONFIRMADO', 'CANCELADO') NOT NULL DEFAULT 'CONFIRMADO',
    `observacao` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `canceladoEm` DATETIME(3) NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `criadoPorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `distribuicoes_gorjeta` (
    `id` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `criterioTexto` VARCHAR(191) NULL,
    `status` ENUM('PENDENTE', 'PAGO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `pagoEm` DATETIME(3) NULL,
    `formaPagamento` VARCHAR(191) NULL,
    `observacao` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechamentoId` VARCHAR(191) NOT NULL,
    `garcomId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_fechamentoGorjetaId_fkey` FOREIGN KEY (`fechamentoGorjetaId`) REFERENCES `fechamentos_gorjeta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fechamentos_gorjeta` ADD CONSTRAINT `fechamentos_gorjeta_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fechamentos_gorjeta` ADD CONSTRAINT `fechamentos_gorjeta_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribuicoes_gorjeta` ADD CONSTRAINT `distribuicoes_gorjeta_fechamentoId_fkey` FOREIGN KEY (`fechamentoId`) REFERENCES `fechamentos_gorjeta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distribuicoes_gorjeta` ADD CONSTRAINT `distribuicoes_gorjeta_garcomId_fkey` FOREIGN KEY (`garcomId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

