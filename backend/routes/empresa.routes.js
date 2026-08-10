const express = require('express');
const { registrar, obterMinhaEmpresa, atualizarCashback } = require('../controllers/empresa.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

// Publica - cadastro de nova empresa (signup do SaaS)
router.post('/registrar', registrar);

router.get('/minha', autenticar, obterMinhaEmpresa);
router.put('/minha/cashback', autenticar, atualizarCashback);

module.exports = router;
