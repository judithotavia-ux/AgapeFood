const express = require('express');
const { resumo } = require('../controllers/estoqueDashboard.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/resumo', resumo);

module.exports = router;
