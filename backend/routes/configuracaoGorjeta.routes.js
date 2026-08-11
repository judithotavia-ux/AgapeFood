const express = require('express');
const { obter, atualizar } = require('../controllers/configuracaoGorjeta.controller');
const { autenticar, exigirPapel } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);

router.get('/', obter);
router.put('/', exigirPapel('ADMIN', 'SUPER_ADMIN', 'GERENTE'), atualizar);

module.exports = router;
