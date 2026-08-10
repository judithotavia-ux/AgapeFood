const express = require('express');
const { gerarTexto } = require('../controllers/iaMarketing.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.post('/gerar-texto', gerarTexto);

module.exports = router;
