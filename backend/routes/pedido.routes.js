const express = require('express');
const { listar, obter, criar, atualizarStatus, cancelar } = require('../controllers/pedido.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.get('/:id', obter);
router.post('/', criar);
router.patch('/:id/status', atualizarStatus);
router.patch('/:id/cancelar', cancelar);

module.exports = router;
