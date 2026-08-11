const express = require('express');
const { obterAtual, abrir, sangria, suprimento, fechar, historico } = require('../controllers/caixa.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.get('/atual', exigirPermissao('caixa.visualizar'), obterAtual);
router.get('/historico', exigirPermissao('caixa.visualizar'), historico);
router.post('/abrir', exigirPermissao('caixa.abrir_fechar'), abrir);
router.post('/:id/sangria', exigirPermissao('caixa.abrir_fechar'), sangria);
router.post('/:id/suprimento', exigirPermissao('caixa.abrir_fechar'), suprimento);
router.post('/:id/fechar', exigirPermissao('caixa.abrir_fechar'), fechar);

module.exports = router;
