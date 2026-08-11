const express = require('express');
const { listar, criar, atualizar, marcarComoPago, cancelar, remover } = require('../controllers/contaPagar.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');
const { exigirPlano } = require('../utils/planos');

const router = express.Router();

router.use(autenticar);
router.use(exigirPlano(1));
router.get('/', exigirPermissao('financeiro.visualizar'), listar);
router.post('/', exigirPermissao('financeiro.gerenciar'), criar);
router.put('/:id', exigirPermissao('financeiro.gerenciar'), atualizar);
router.post('/:id/pagar', exigirPermissao('financeiro.aprovar_conta'), marcarComoPago);
router.post('/:id/cancelar', exigirPermissao('financeiro.gerenciar'), cancelar);
router.delete('/:id', exigirPermissao('financeiro.gerenciar'), remover);

module.exports = router;
