const express = require('express');
const { listar, criar, atualizar, remover, validar } = require('../controllers/cupom.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.get('/validar/:codigo', validar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);

module.exports = router;
