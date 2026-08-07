const express = require('express');
const { registrar } = require('../controllers/empresa.controller');

const router = express.Router();

// Publica - cadastro de nova empresa (signup do SaaS)
router.post('/registrar', registrar);

module.exports = router;
