const express = require('express');
const { resumo, fluxoCaixa } = require('../controllers/financeiroDashboard.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/resumo', resumo);
router.get('/fluxo-caixa', fluxoCaixa);

module.exports = router;
