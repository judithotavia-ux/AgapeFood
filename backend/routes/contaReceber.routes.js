const express = require('express');
const { listar, criar, atualizar, marcarComoRecebido, cancelar, remover } = require('../controllers/contaReceber.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.post('/:id/receber', marcarComoRecebido);
router.post('/:id/cancelar', cancelar);
router.delete('/:id', remover);

module.exports = router;
