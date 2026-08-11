-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `pinHash` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `limites_aprovacao` (
    `id` VARCHAR(191) NOT NULL,
    `papel` ENUM('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'FUNCIONARIO', 'GARCOM') NOT NULL,
    `limiteDescontoPercentual` DECIMAL(5, 2) NULL,
    `limiteDescontoValor` DECIMAL(10, 2) NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `limites_aprovacao_empresaId_papel_key`(`empresaId`, `papel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aprovacoes_gerenciais` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('DESCONTO', 'CANCELAMENTO') NOT NULL,
    `valorAntes` DECIMAL(10, 2) NULL,
    `valorDepois` DECIMAL(10, 2) NULL,
    `percentual` DECIMAL(5, 2) NULL,
    `motivo` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,
    `pedidoId` VARCHAR(191) NOT NULL,
    `solicitanteId` VARCHAR(191) NOT NULL,
    `aprovadorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `limites_aprovacao` ADD CONSTRAINT `limites_aprovacao_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aprovacoes_gerenciais` ADD CONSTRAINT `aprovacoes_gerenciais_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aprovacoes_gerenciais` ADD CONSTRAINT `aprovacoes_gerenciais_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aprovacoes_gerenciais` ADD CONSTRAINT `aprovacoes_gerenciais_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aprovacoes_gerenciais` ADD CONSTRAINT `aprovacoes_gerenciais_aprovadorId_fkey` FOREIGN KEY (`aprovadorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

