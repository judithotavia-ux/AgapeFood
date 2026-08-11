-- AlterTable
ALTER TABLE `empresas` ADD COLUMN `exibirLogoCardapio` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `exibirSloganCardapio` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `exibirSloganComanda` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `mensagemAgradecimento` TEXT NULL,
    ADD COLUMN `rodapeComanda` TEXT NULL;

