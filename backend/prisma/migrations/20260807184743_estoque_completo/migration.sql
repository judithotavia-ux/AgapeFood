-- AlterTable
ALTER TABLE `produtos` ADD COLUMN `cest` VARCHAR(191) NULL,
    ADD COLUMN `codigoBarras` VARCHAR(191) NULL,
    ADD COLUMN `controlaEstoque` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `controlaLote` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `controlaValidade` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `custo` DECIMAL(10, 2) NULL,
    ADD COLUMN `estoqueAtual` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN `estoqueMaximo` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN `estoqueMinimo` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN `fabricante` VARCHAR(191) NULL,
    ADD COLUMN `localizacao` VARCHAR(191) NULL,
    ADD COLUMN `marca` VARCHAR(191) NULL,
    ADD COLUMN `ncm` VARCHAR(191) NULL,
    ADD COLUMN `peso` DECIMAL(10, 3) NULL,
    ADD COLUMN `pontoReposicao` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `unidade` VARCHAR(191) NULL DEFAULT 'UN',
    ADD COLUMN `volume` DECIMAL(10, 3) NULL;

-- CreateTable
CREATE TABLE `fornecedores` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cnpjCpf` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NULL,
    `contato` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lotes` (
    `id` VARCHAR(191) NOT NULL,
    `numeroLote` VARCHAR(191) NOT NULL,
    `quantidade` DECIMAL(12, 3) NOT NULL,
    `custoUnitario` DECIMAL(10, 2) NULL,
    `dataFabricacao` DATETIME(3) NULL,
    `dataValidade` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `produtoId` VARCHAR(191) NOT NULL,
    `fornecedorId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimentacoes_estoque` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'INVENTARIO', 'PERDA', 'QUEBRA', 'CONSUMO_INTERNO', 'PRODUCAO', 'COMPRA', 'VENDA', 'AJUSTE') NOT NULL,
    `quantidade` DECIMAL(12, 3) NOT NULL,
    `custoUnitario` DECIMAL(10, 2) NULL,
    `motivo` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,
    `loteId` VARCHAR(191) NULL,
    `usuarioId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fornecedores` ADD CONSTRAINT `fornecedores_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `lotes_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `lotes_fornecedorId_fkey` FOREIGN KEY (`fornecedorId`) REFERENCES `fornecedores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes_estoque` ADD CONSTRAINT `movimentacoes_estoque_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes_estoque` ADD CONSTRAINT `movimentacoes_estoque_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes_estoque` ADD CONSTRAINT `movimentacoes_estoque_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `lotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimentacoes_estoque` ADD CONSTRAINT `movimentacoes_estoque_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
