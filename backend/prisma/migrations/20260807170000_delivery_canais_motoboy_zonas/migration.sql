-- AlterTable
ALTER TABLE `pedidos`
  ADD COLUMN `canalEntrega` ENUM('MOTOBOY_PROPRIO', 'IFOOD', 'UBER_EATS', 'NOVENTA_NOVE_FOOD') NULL,
  ADD COLUMN `taxaMotoboy` DECIMAL(10, 2) NULL,
  ADD COLUMN `idExterno` VARCHAR(191) NULL,
  ADD COLUMN `motoboyId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `motoboys` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `veiculo` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zonas_entrega` (
    `id` VARCHAR(191) NOT NULL,
    `bairro` VARCHAR(191) NOT NULL,
    `taxaEntrega` DECIMAL(10, 2) NOT NULL,
    `tempoEstimadoMin` INTEGER NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `empresaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `zonas_entrega_empresaId_bairro_key`(`empresaId`, `bairro`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `canais_entrega_config` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('MOTOBOY_PROPRIO', 'IFOOD', 'UBER_EATS', 'NOVENTA_NOVE_FOOD') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT false,
    `webhookToken` VARCHAR(191) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `canais_entrega_config_webhookToken_key`(`webhookToken`),
    UNIQUE INDEX `canais_entrega_config_empresaId_tipo_key`(`empresaId`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `pedidos_empresaId_canalEntrega_idExterno_key` ON `pedidos`(`empresaId`, `canalEntrega`, `idExterno`);

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_motoboyId_fkey` FOREIGN KEY (`motoboyId`) REFERENCES `motoboys`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `motoboys` ADD CONSTRAINT `motoboys_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `zonas_entrega` ADD CONSTRAINT `zonas_entrega_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `canais_entrega_config` ADD CONSTRAINT `canais_entrega_config_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
