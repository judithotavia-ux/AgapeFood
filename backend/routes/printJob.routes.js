const express = require('express');
const { listar, obter, reportarResultado, retry, reimprimir, cancelar, listarLogs } = require('../controllers/printJob.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(autenticar);
router.get('/', listar);
router.get('/logs', listarLogs);
router.get('/:id', obter);
router.post('/:id/resultado', reportarResultado);
router.post('/:id/retry', retry);
router.post('/:id/reimprimir', reimprimir);
router.post('/:id/cancelar', cancelar);

module.exports = router;
