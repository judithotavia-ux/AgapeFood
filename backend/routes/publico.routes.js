const express = require('express');
const { cardapio } = require('../controllers/publico.controller');

const router = express.Router();

router.get('/cardapio/:slug', cardapio);

module.exports = router;
