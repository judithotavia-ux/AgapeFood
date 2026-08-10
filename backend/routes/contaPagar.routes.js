const express = require('express');
const { listar, criar, atualizar, marcarComoPago, cancelar, remover } = require('../controllers/contaPagar.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.post('/:id/pagar', marcarComoPago);
router.post('/:id/cancelar', cancelar);
router.delete('/:id', remover);

module.exports = router;
