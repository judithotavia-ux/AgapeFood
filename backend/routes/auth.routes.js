const express = require('express');
const { login, me, esqueciSenha, redefinirSenha, definirPin, removerPin, statusPin } = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', autenticar, me);
router.post('/esqueci-senha', esqueciSenha);
router.post('/redefinir-senha', redefinirSenha);
router.get('/meu-pin', autenticar, statusPin);
router.put('/meu-pin', autenticar, definirPin);
router.delete('/meu-pin', autenticar, removerPin);

module.exports = router;
