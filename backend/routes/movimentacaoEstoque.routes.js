const express = require('express');
const { listar, criar } = require('../controllers/movimentacaoEstoque.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.post('/', criar);

module.exports = router;
