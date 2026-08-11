const express = require('express');
const { listar, criar, atualizar, marcarComoRecebido, cancelar, remover } = require('../controllers/contaReceber.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.get('/', exigirPermissao('financeiro.visualizar'), listar);
router.post('/', exigirPermissao('financeiro.gerenciar'), criar);
router.put('/:id', exigirPermissao('financeiro.gerenciar'), atualizar);
router.post('/:id/receber', exigirPermissao('financeiro.aprovar_conta'), marcarComoRecebido);
router.post('/:id/cancelar', exigirPermissao('financeiro.gerenciar'), cancelar);
router.delete('/:id', exigirPermissao('financeiro.gerenciar'), remover);

module.exports = router;
