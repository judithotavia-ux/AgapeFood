-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `garcomNome` VARCHAR(191) NULL,
    ADD COLUMN `origemPedido` VARCHAR(191) NULL DEFAULT 'PAINEL';

-- AlterTable
ALTER TABLE `produtos` ADD COLUMN `setorProducao` ENUM('COZINHA', 'BAR', 'CONFEITARIA', 'PIZZARIA', 'ACAI', 'SALGADOS', 'BALCAO', 'OUTRO') NOT NULL DEFAULT 'COZINHA';

-- CreateTable
CREATE TABLE `impressoras` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `setor` ENUM('COZINHA', 'BAR', 'CONFEITARIA', 'PIZZARIA', 'ACAI', 'SALGADOS', 'BALCAO', 'OUTRO') NOT NULL DEFAULT 'COZINHA',
    `fabricante` VARCHAR(191) NULL,
    `modelo` VARCHAR(191) NULL,
    `tipoConexao` ENUM('USB', 'REDE', 'BLUETOOTH') NOT NULL DEFAULT 'USB',
    `identificadorLocal` VARCHAR(191) NULL,
    `larguraPapelMm` INTEGER NOT NULL DEFAULT 80,
    `caracteresPorLinha` INTEGER NOT NULL DEFAULT 48,
    `copias` INTEGER NOT NULL DEFAULT 1,
    `ativa` BOOLEAN NOT NULL DEFAULT true,
    `padrao` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ONLINE', 'OFFLINE', 'ATENCAO') NOT NULL DEFAULT 'OFFLINE',
    `ultimaImpressaoEm` DATETIME(3) NULL,
    `ultimoErro` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `print_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `tipoDocumento` ENUM('COMANDA_COZINHA', 'COMANDA_GARCOM', 'COMANDA_DELIVERY', 'COMANDA_CAIXA', 'CANCELAMENTO', 'ALTERACAO', 'TESTE') NOT NULL,
    `setor` ENUM('COZINHA', 'BAR', 'CONFEITARIA', 'PIZZARIA', 'ACAI', 'SALGADOS', 'BALCAO', 'OUTRO') NOT NULL,
    `status` ENUM('PENDING', 'PRINTING', 'PRINTED', 'FAILED', 'RETRYING', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `prioridade` ENUM('NORMAL', 'ALTA', 'URGENTE', 'VIP') NOT NULL DEFAULT 'NORMAL',
    `payload` TEXT NOT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `erro` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `impressoEm` DATETIME(3) NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `printerId` VARCHAR(191) NOT NULL,
    `pedidoId` VARCHAR(191) NULL,

    INDEX `print_jobs_empresaId_status_idx`(`empresaId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `print_logs` (
    `id` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `detalhe` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `printJobId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `impressoras` ADD CONSTRAINT `impressoras_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `print_jobs` ADD CONSTRAINT `print_jobs_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `print_jobs` ADD CONSTRAINT `print_jobs_printerId_fkey` FOREIGN KEY (`printerId`) REFERENCES `impressoras`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `print_jobs` ADD CONSTRAINT `print_jobs_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `print_logs` ADD CONSTRAINT `print_logs_printJobId_fkey` FOREIGN KEY (`printJobId`) REFERENCES `print_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `print_logs` ADD CONSTRAINT `print_logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

