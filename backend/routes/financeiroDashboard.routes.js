const express = require('express');
const { resumo, fluxoCaixa } = require('../controllers/financeiroDashboard.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.use(exigirPermissao('financeiro.visualizar'));
router.get('/resumo', resumo);
router.get('/fluxo-caixa', fluxoCaixa);

module.exports = router;
