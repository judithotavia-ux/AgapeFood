-- CreateTable
CREATE TABLE `conversas_ia` (
    `id` VARCHAR(191) NOT NULL,
    `canal` ENUM('PAINEL_ADMIN', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'SITE', 'APP', 'TELEGRAM', 'EMAIL') NOT NULL DEFAULT 'PAINEL_ADMIN',
    `titulo` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensagens_ia` (
    `id` VARCHAR(191) NOT NULL,
    `papel` ENUM('USUARIO', 'ASSISTENTE', 'FERRAMENTA') NOT NULL,
    `conteudo` TEXT NOT NULL,
    `ferramentaUsada` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `conversaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `acoes_ia` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PERGUNTA_RESPONDIDA', 'PEDIDO_CRIADO', 'PROMOCAO_CRIADA', 'CAMPANHA_CRIADA', 'RELATORIO_GERADO', 'TAREFA_CRIADA') NOT NULL,
    `referenciaId` VARCHAR(191) NULL,
    `detalhe` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empresaId` VARCHAR(191) NOT NULL,
    `conversaId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarefas_ia` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `status` ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA') NOT NULL DEFAULT 'PENDENTE',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `concluidaEm` DATETIME(3) NULL,
    `empresaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `conversas_ia` ADD CONSTRAINT `conversas_ia_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversas_ia` ADD CONSTRAINT `conversas_ia_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversas_ia` ADD CONSTRAINT `conversas_ia_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagens_ia` ADD CONSTRAINT `mensagens_ia_conversaId_fkey` FOREIGN KEY (`conversaId`) REFERENCES `conversas_ia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acoes_ia` ADD CONSTRAINT `acoes_ia_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acoes_ia` ADD CONSTRAINT `acoes_ia_conversaId_fkey` FOREIGN KEY (`conversaId`) REFERENCES `conversas_ia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acoes_ia` ADD CONSTRAINT `acoes_ia_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarefas_ia` ADD CONSTRAINT `tarefas_ia_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

