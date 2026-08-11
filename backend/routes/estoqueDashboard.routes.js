const express = require('express');
const { resumo } = require('../controllers/estoqueDashboard.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPlano } = require('../utils/planos');

const router = express.Router();

router.use(autenticar);
router.use(exigirPlano(1));
router.get('/resumo', resumo);

module.exports = router;
