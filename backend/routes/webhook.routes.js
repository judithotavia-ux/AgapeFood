const express = require('express');
const { receberPedido } = require('../controllers/webhook.controller');

const router = express.Router();

// Rotas publicas (sem JWT) - autenticadas por token proprio do canal.
router.post('/:rota/:empresaSlug', receberPedido);

module.exports = router;
