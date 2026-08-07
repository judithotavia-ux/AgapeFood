const express = require('express');
const {
  listar, obter, criar, atualizar, remover, adicionarAdicional, removerAdicional, atualizarEstoqueConfig
} = require('../controllers/produto.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.get('/:id', obter);
router.post('/', upload.single('imagem'), criar);
router.put('/:id', upload.single('imagem'), atualizar);
router.put('/:id/estoque-config', atualizarEstoqueConfig);
router.delete('/:id', remover);

router.post('/:id/adicionais', adicionarAdicional);
router.delete('/:id/adicionais/:adicionalId', removerAdicional);

module.exports = router;
