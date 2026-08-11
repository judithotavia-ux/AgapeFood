const express = require('express');
const { login, me, esqueciSenha, redefinirSenha } = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', autenticar, me);
router.post('/esqueci-senha', esqueciSenha);
router.post('/redefinir-senha', redefinirSenha);

module.exports = router;
