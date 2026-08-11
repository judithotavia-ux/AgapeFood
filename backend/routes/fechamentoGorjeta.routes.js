const express = require('express');
const { preview, confirmar, listar, obter, cancelar, marcarPago } = require('../controllers/fechamentoGorjeta.controller');
const { autenticar, exigirPapel } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.use(exigirPapel('ADMIN', 'SUPER_ADMIN', 'GERENTE'));

router.get('/preview', preview);
router.post('/', confirmar);
router.get('/', listar);
router.get('/:id', obter);
router.post('/:id/cancelar', cancelar);
router.patch('/:id/distribuicoes/:distribuicaoId/pagar', marcarPago);

module.exports = router;
