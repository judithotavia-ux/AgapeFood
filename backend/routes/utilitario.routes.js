const express = require('express');
const { buscarCnpj, buscarCep } = require('../controllers/utilitario.controller');

const router = express.Router();

// Publicas - usadas no formulario de cadastro de empresa (antes de ter login)
router.get('/cnpj/:cnpj', buscarCnpj);
router.get('/cep/:cep', buscarCep);

module.exports = router;
