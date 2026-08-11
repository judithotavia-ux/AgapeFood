const express = require('express');
const {
  conversar, listarConversas, obterConversa, removerConversa, dashboard, atualizarTarefa, uso
} = require('../controllers/agapeIa.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPlano } = require('../utils/planos');

const router = express.Router();

router.use(autenticar);
router.use(exigirPlano(2));
router.post('/chat', conversar);
router.get('/conversas', listarConversas);
router.get('/conversas/:id', obterConversa);
router.delete('/conversas/:id', removerConversa);
router.get('/dashboard', dashboard);
router.get('/uso', uso);
router.patch('/tarefas/:id', atualizarTarefa);

module.exports = router;
