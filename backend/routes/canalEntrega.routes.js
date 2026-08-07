const express = require('express');
const { listar, atualizar, regenerarToken } = require('../controllers/canalEntrega.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.put('/:id', atualizar);
router.post('/:id/regenerar-token', regenerarToken);

module.exports = router;
