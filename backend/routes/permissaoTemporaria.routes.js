const express = require('express');
const { listar, conceder, revogar } = require('../controllers/permissaoTemporaria.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.use(exigirPermissao('equipe.gerenciar_permissoes'));

router.get('/', listar);
router.post('/', conceder);
router.post('/:id/revogar', revogar);

module.exports = router;
