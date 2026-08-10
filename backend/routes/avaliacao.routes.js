const express = require('express');
const { listar, criarPublica, obterPublica } = require('../controllers/avaliacao.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

// Publicas (tela de avaliacao pos-pedido, sem login)
router.get('/publica/:pedidoId', obterPublica);
router.post('/publica/:pedidoId', criarPublica);

// Administrativas
router.get('/', autenticar, listar);

module.exports = router;
