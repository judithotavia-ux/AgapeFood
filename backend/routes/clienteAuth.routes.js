const express = require('express');
const { solicitarAcesso, verificarOtp } = require('../controllers/clienteAuth.controller');

const router = express.Router();

router.post('/solicitar-acesso', solicitarAcesso);
router.post('/verificar-otp', verificarOtp);

module.exports = router;
