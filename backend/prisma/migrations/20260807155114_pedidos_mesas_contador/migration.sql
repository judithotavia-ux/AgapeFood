-- CreateTable
CREATE TABLE `contadores_pedido` (
    `id` VARCHAR(191) NOT NULL,
    `ultimoNumero` INTEGER NOT NULL DEFAULT 0,
    `empresaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `contadores_pedido_empresaId_key`(`empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mesas` (
    `id` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `capacidade` INTEGER NOT NULL DEFAULT 4,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `empresaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `mesas_empresaId_numero_key`(`empresaId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `tipo` ENUM('DELIVERY', 'RETIRADA', 'BALCAO', 'MESA') NOT NULL,
    `status` ENUM('RECEBIDO', 'PREPARANDO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO') NOT NULL DEFAULT 'RECEBIDO',
    `clienteNome` VARCHAR(191) NULL,
    `clienteTelefone` VARCHAR(191) NULL,
    `clienteEndereco` TEXT NULL,
    `formaPagamento` ENUM('PIX', 'CARTAO', 'DINHEIRO', 'VALE_ALIMENTACAO') NULL,
    `taxaEntrega` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valorTotal` DECIMAL(10, 2) NOT NULL,
    `observacoes` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `mesaId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedido_itens` (
    `id` VARCHAR(191) NOT NULL,
    `nomeProduto` VARCHAR(191) NOT NULL,
    `precoUnitario` DECIMAL(10, 2) NOT NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 1,
    `observacoes` TEXT NULL,
    `adicionaisJson` TEXT NULL,
    `pedidoId` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contadores_pedido` ADD CONSTRAINT `contadores_pedido_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mesas` ADD CONSTRAINT `mesas_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_mesaId_fkey` FOREIGN KEY (`mesaId`) REFERENCES `mesas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_itens` ADD CONSTRAINT `pedido_itens_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido_itens` ADD CONSTRAINT `pedido_itens_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
