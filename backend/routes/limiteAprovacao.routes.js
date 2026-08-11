const express = require('express');
const { listar, atualizar } = require('../controllers/limiteAprovacao.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');

const router = express.Router();

router.use(autenticar);

// Ver os limites atuais e definir/usar PIN vivem na mesma tela pra ADMIN e GERENTE - por isso GET
// so exige a permissao de quem pode aprovar excecao. Mudar os limites em si (politica da empresa)
// continua restrito a quem gerencia configuracoes da empresa.
router.get('/', exigirPermissao('caixa.aprovar_excecao'), listar);
router.put('/:papel', exigirPermissao('configuracoes_empresa.gerenciar'), atualizar);

module.exports = router;
