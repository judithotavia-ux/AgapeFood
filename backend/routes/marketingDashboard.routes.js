const express = require('express');
const { resumo, horariosDePico } = require('../controllers/marketingDashboard.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPlano } = require('../utils/planos');

const router = express.Router();

router.use(autenticar);
router.use(exigirPlano(2));
router.get('/resumo', resumo);
router.get('/horarios-de-pico', horariosDePico);

module.exports = router;
