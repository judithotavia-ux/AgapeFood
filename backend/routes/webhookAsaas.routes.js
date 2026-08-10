const express = require('express');
const { receberEvento } = require('../controllers/webhookAsaas.controller');

const router = express.Router();

// Publica (sem JWT) - autenticada pelo header asaas-access-token configurado no Asaas
router.post('/', receberEvento);

module.exports = router;
