const express = require('express');
const router = express.Router();
const { autenticar, exigirPapel } = require('../middlewares/auth.middleware');
const { listarCatalogo, minhasPermissoes } = require('../controllers/permissao.controller');

router.use(autenticar);

router.get('/minhas', minhasPermissoes);
router.get('/', exigirPapel('ADMIN', 'SUPER_ADMIN', 'GERENTE'), listarCatalogo);

module.exports = router;
