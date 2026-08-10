-- CreateTable
CREATE TABLE `categorias_financeiras` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('RECEITA', 'DESPESA') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contas_pagar` (
    `id` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `vencimento` DATETIME(3) NOT NULL,
    `status` ENUM('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `pagoEm` DATETIME(3) NULL,
    `valorPago` DECIMAL(10, 2) NULL,
    `formaPagamento` ENUM('PIX', 'CARTAO', 'DINHEIRO', 'VALE_ALIMENTACAO') NULL,
    `observacoes` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NULL,
    `fornecedorId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contas_receber` (
    `id` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `vencimento` DATETIME(3) NOT NULL,
    `status` ENUM('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `recebidoEm` DATETIME(3) NULL,
    `valorRecebido` DECIMAL(10, 2) NULL,
    `formaPagamento` ENUM('PIX', 'CARTAO', 'DINHEIRO', 'VALE_ALIMENTACAO') NULL,
    `clienteNome` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categorias_financeiras` ADD CONSTRAINT `categorias_financeiras_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias_financeiras`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_fornecedorId_fkey` FOREIGN KEY (`fornecedorId`) REFERENCES `fornecedores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_receber` ADD CONSTRAINT `contas_receber_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas_receber` ADD CONSTRAINT `contas_receber_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias_financeiras`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
