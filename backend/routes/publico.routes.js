const express = require('express');
const { cardapio, criarPedido } = require('../controllers/publico.controller');

const router = express.Router();

router.get('/cardapio/:slug', cardapio);
router.post('/cardapio/:slug/pedido', criarPedido);

module.exports = router;
