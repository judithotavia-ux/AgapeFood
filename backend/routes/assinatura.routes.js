const express = require('express');
const { listarPlanos, obterMinhaAssinatura, assinar, cancelar } = require('../controllers/assinatura.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/planos', listarPlanos);
router.get('/minha', obterMinhaAssinatura);
router.post('/assinar', assinar);
router.post('/cancelar', cancelar);

module.exports = router;
