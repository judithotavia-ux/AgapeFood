const express = require('express');
const { listar, obter, criar, atualizar, redefinirSenha, desativar } = require('../controllers/garcom.controller');
const { autenticar, exigirPapel } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.use(exigirPapel('ADMIN', 'SUPER_ADMIN', 'GERENTE'));

router.get('/', listar);
router.get('/:id', obter);
router.post('/', criar);
router.put('/:id', atualizar);
router.put('/:id/senha', redefinirSenha);
router.delete('/:id', desativar);

module.exports = router;
