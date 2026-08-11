const express = require('express');
const { listar } = require('../controllers/auditoria.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.use(exigirPermissao('equipe.gerenciar_permissoes'));

router.get('/', listar);

module.exports = router;
