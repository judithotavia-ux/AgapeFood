-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `aceitaComunicacoes` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `excluidoEm` DATETIME(3) NULL,
    ADD COLUMN `senhaHash` VARCHAR(191) NULL,
    ADD COLUMN `ultimoAcessoEm` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `empresas` ADD COLUMN `mensagemCardapioWhatsapp` TEXT NULL;

-- CreateTable
CREATE TABLE `enderecos_cliente` (
    `id` VARCHAR(191) NOT NULL,
    `apelido` VARCHAR(191) NOT NULL DEFAULT 'Casa',
    `cep` VARCHAR(191) NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NULL,
    `complemento` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NULL,
    `cidade` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NULL,
    `pontoReferencia` VARCHAR(191) NULL,
    `principal` BOOLEAN NOT NULL DEFAULT false,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clienteId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favoritos` (
    `id` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clienteId` VARCHAR(191) NOT NULL,
    `produtoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `favoritos_clienteId_produtoId_key`(`clienteId`, `produtoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otps_cliente` (
    `id` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `codigoHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `verificadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,

    INDEX `otps_cliente_empresaId_telefone_idx`(`empresaId`, `telefone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `enderecos_cliente` ADD CONSTRAINT `enderecos_cliente_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favoritos` ADD CONSTRAINT `favoritos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favoritos` ADD CONSTRAINT `favoritos_produtoId_fkey` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `otps_cliente` ADD CONSTRAINT `otps_cliente_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

