const express = require('express');
const { resumo } = require('../controllers/dashboard.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/resumo', autenticar, resumo);

module.exports = router;
