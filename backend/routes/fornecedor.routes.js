const express = require('express');
const { listar, criar, atualizar, remover } = require('../controllers/fornecedor.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPlano } = require('../utils/planos');

const router = express.Router();

router.use(autenticar);
router.use(exigirPlano(1));
router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);

module.exports = router;
