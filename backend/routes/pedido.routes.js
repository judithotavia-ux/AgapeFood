const express = require('express');
const { listar, obter, criar, atualizarStatus, cancelar, aplicarDesconto } = require('../controllers/pedido.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.get('/:id', obter);
router.post('/', criar);
router.patch('/:id/status', atualizarStatus);
// Cancelamento nao usa exigirPermissao aqui porque o controller aceita duas rotas de acesso:
// ter a permissao pedidos.cancelar, OU informar o PIN de alguem que aprova a excecao.
router.patch('/:id/cancelar', cancelar);
router.patch('/:id/desconto', exigirPermissao('caixa.aplicar_desconto'), aplicarDesconto);

module.exports = router;
