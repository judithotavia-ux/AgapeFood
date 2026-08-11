const express = require('express');
const {
  meuPerfil, atualizarPerfil,
  listarEnderecos, criarEndereco, atualizarEndereco, removerEndereco,
  listarFavoritos, adicionarFavorito, removerFavorito,
  meusPedidos
} = require('../controllers/clientePortal.controller');
const { autenticarCliente } = require('../middlewares/clienteAuth.middleware');

const router = express.Router();

router.use(autenticarCliente);

router.get('/perfil', meuPerfil);
router.put('/perfil', atualizarPerfil);

router.get('/enderecos', listarEnderecos);
router.post('/enderecos', criarEndereco);
router.put('/enderecos/:id', atualizarEndereco);
router.delete('/enderecos/:id', removerEndereco);

router.get('/favoritos', listarFavoritos);
router.post('/favoritos', adicionarFavorito);
router.delete('/favoritos/:produtoId', removerFavorito);

router.get('/pedidos', meusPedidos);

module.exports = router;
