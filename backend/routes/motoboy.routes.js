const express = require('express');
const { listar, criar, atualizar, remover, resumoGanhos } = require('../controllers/motoboy.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.get('/resumo', resumoGanhos);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);

module.exports = router;
