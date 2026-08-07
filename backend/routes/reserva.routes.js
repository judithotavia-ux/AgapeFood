const express = require('express');
const { listar, criar, atualizarStatus } = require('../controllers/reserva.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.post('/', criar);
router.patch('/:id/status', atualizarStatus);

module.exports = router;
