const express = require('express');
const { listar, obter, criar, atualizar, remover, testarImpressao } = require('../controllers/impressora.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.get('/:id', obter);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);
router.post('/:id/testar', testarImpressao);

module.exports = router;
