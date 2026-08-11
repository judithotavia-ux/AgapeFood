const express = require('express');
const { listar, obter, criar, atualizar, redefinirSenha, desativar, meuDesempenho } = require('../controllers/garcom.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);

// Autoatendimento - qualquer usuario autenticado ve o proprio desempenho, sem exigir permissao de gestao
router.get('/meu-desempenho', meuDesempenho);

router.get('/', exigirPermissao('equipe.visualizar'), listar);
router.get('/:id', exigirPermissao('equipe.visualizar'), obter);
router.post('/', exigirPermissao('equipe.gerenciar'), criar);
router.put('/:id', exigirPermissao('equipe.gerenciar'), atualizar);
router.put('/:id/senha', exigirPermissao('equipe.gerenciar'), redefinirSenha);
router.delete('/:id', exigirPermissao('equipe.gerenciar'), desativar);

module.exports = router;
