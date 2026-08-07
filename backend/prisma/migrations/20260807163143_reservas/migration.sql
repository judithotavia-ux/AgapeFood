-- CreateTable
CREATE TABLE `reservas` (
    `id` VARCHAR(191) NOT NULL,
    `clienteNome` VARCHAR(191) NOT NULL,
    `clienteTelefone` VARCHAR(191) NULL,
    `dataHora` DATETIME(3) NOT NULL,
    `pessoas` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('CONFIRMADA', 'CANCELADA', 'CONCLUIDA') NOT NULL DEFAULT 'CONFIRMADA',
    `observacoes` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,
    `mesaId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_mesaId_fkey` FOREIGN KEY (`mesaId`) REFERENCES `mesas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
