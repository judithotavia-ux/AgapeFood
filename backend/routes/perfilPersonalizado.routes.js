const express = require('express');
const { listar, criar, atualizar, remover } = require('../controllers/perfilPersonalizado.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);
router.use(exigirPermissao('equipe.gerenciar_permissoes'));

router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);

module.exports = router;
