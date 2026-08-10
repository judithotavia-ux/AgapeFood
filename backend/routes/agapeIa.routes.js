const express = require('express');
const {
  conversar, listarConversas, obterConversa, removerConversa, dashboard, atualizarTarefa
} = require('../controllers/agapeIa.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.post('/chat', conversar);
router.get('/conversas', listarConversas);
router.get('/conversas/:id', obterConversa);
router.delete('/conversas/:id', removerConversa);
router.get('/dashboard', dashboard);
router.patch('/tarefas/:id', atualizarTarefa);

module.exports = router;
