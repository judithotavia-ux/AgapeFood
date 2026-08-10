const express = require('express');
const { listar, obter, atualizar } = require('../controllers/cliente.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.get('/:id', obter);
router.put('/:id', atualizar);

module.exports = router;
