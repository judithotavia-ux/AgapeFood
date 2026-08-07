const express = require('express');
const { listar, criar, atualizar, remover, comanda, transferir, fechar } = require('../controllers/mesa.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);
router.get('/:id/comanda', comanda);
router.post('/:id/transferir', transferir);
router.post('/:id/fechar', fechar);

module.exports = router;
