const express = require('express');
const { listar, obter, criar, atualizar, redefinirSenha, desativar, meuDesempenho } = require('../controllers/garcom.controller');
const { autenticar, exigirPapel } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);

// Autoatendimento - qualquer usuario autenticado ve o proprio desempenho, sem exigir papel de gestao
router.get('/meu-desempenho', meuDesempenho);

router.use(exigirPapel('ADMIN', 'SUPER_ADMIN', 'GERENTE'));

router.get('/', listar);
router.get('/:id', obter);
router.post('/', criar);
router.put('/:id', atualizar);
router.put('/:id/senha', redefinirSenha);
router.delete('/:id', desativar);

module.exports = router;
