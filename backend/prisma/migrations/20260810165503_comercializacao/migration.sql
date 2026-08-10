-- AlterTable
ALTER TABLE `empresas` ADD COLUMN `termosAceitosEm` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `planos` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `ciclo` ENUM('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL') NOT NULL DEFAULT 'MENSAL',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assinaturas` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('TRIAL', 'ATIVA', 'INADIMPLENTE', 'CANCELADA', 'PENDENTE') NOT NULL DEFAULT 'TRIAL',
    `formaPagamento` ENUM('PIX', 'BOLETO', 'CARTAO', 'INDEFINIDO') NOT NULL DEFAULT 'INDEFINIDO',
    `inicioTrialEm` DATETIME(3) NULL,
    `fimTrialEm` DATETIME(3) NULL,
    `proximaCobrancaEm` DATETIME(3) NULL,
    `canceladaEm` DATETIME(3) NULL,
    `motivoCancelamento` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `asaasCustomerId` VARCHAR(191) NULL,
    `asaasSubscriptionId` VARCHAR(191) NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `planoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `assinaturas_empresaId_key`(`empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cobrancas` (
    `id` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `vencimento` DATETIME(3) NOT NULL,
    `pagoEm` DATETIME(3) NULL,
    `formaPagamento` ENUM('PIX', 'BOLETO', 'CARTAO', 'INDEFINIDO') NULL,
    `asaasPaymentId` VARCHAR(191) NULL,
    `linkPagamento` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assinaturaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `cobrancas_asaasPaymentId_key`(`asaasPaymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assinaturas` ADD CONSTRAINT `assinaturas_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assinaturas` ADD CONSTRAINT `assinaturas_planoId_fkey` FOREIGN KEY (`planoId`) REFERENCES `planos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cobrancas` ADD CONSTRAINT `cobrancas_assinaturaId_fkey` FOREIGN KEY (`assinaturaId`) REFERENCES `assinaturas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
