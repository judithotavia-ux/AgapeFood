const express = require('express');
const { listar, criar, atualizar, remover } = require('../controllers/categoriaFinanceira.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.get('/', exigirPermissao('financeiro.visualizar'), listar);
router.post('/', exigirPermissao('financeiro.gerenciar'), criar);
router.put('/:id', exigirPermissao('financeiro.gerenciar'), atualizar);
router.delete('/:id', exigirPermissao('financeiro.gerenciar'), remover);

module.exports = router;
