const express = require('express');
const { listar, criar, remover } = require('../controllers/mesa.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.post('/', criar);
router.delete('/:id', remover);

module.exports = router;
