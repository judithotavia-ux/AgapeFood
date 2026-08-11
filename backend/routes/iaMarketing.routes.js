const express = require('express');
const { gerarTexto } = require('../controllers/iaMarketing.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPlano } = require('../utils/planos');

const router = express.Router();

router.use(autenticar);
router.use(exigirPlano(2));
router.post('/gerar-texto', gerarTexto);

module.exports = router;
