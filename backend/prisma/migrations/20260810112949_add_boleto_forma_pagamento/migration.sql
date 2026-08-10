-- AlterTable
ALTER TABLE `contas_pagar` MODIFY `formaPagamento` ENUM('PIX', 'CARTAO', 'DINHEIRO', 'VALE_ALIMENTACAO', 'BOLETO') NULL;

-- AlterTable
ALTER TABLE `contas_receber` MODIFY `formaPagamento` ENUM('PIX', 'CARTAO', 'DINHEIRO', 'VALE_ALIMENTACAO', 'BOLETO') NULL;

-- AlterTable
ALTER TABLE `pedidos` MODIFY `formaPagamento` ENUM('PIX', 'CARTAO', 'DINHEIRO', 'VALE_ALIMENTACAO', 'BOLETO') NULL;
