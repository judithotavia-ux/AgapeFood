const express = require('express');
const { obterAtual, abrir, sangria, suprimento, fechar, historico } = require('../controllers/caixa.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/atual', obterAtual);
router.get('/historico', historico);
router.post('/abrir', abrir);
router.post('/:id/sangria', sangria);
router.post('/:id/suprimento', suprimento);
router.post('/:id/fechar', fechar);

module.exports = router;
