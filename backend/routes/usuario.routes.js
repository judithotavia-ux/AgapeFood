const express = require('express');
const { listar, atribuirPerfil } = require('../controllers/usuario.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.use(exigirPermissao('equipe.gerenciar_permissoes'));

router.get('/', listar);
router.put('/:id/perfil-personalizado', atribuirPerfil);

module.exports = router;
