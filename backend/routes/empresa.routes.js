const express = require('express');
const {
  registrar, obterMinhaEmpresa, atualizarCashback, obterConfigIA, atualizarConfigIA,
  obterIdentidadeVisual, atualizarIdentidadeVisual, obterDadosFiscais, atualizarDadosFiscais
} = require('../controllers/empresa.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { exigirPermissao } = require('../utils/permissoes');
const uploadLogos = require('../middlewares/uploadLogo.middleware');

const router = express.Router();

// Publica - cadastro de nova empresa (signup do SaaS)
router.post('/registrar', registrar);

// GET fica so autenticado: sao consultas usadas dentro de outras telas (Marketing, Agape IA)
// que ainda nao tem gate por permissao neste modulo - so a mutacao (mudar configuracao) e restrita.
router.get('/minha', autenticar, obterMinhaEmpresa);
// Cashback e uma alavanca de marketing/fidelidade, nao um dado cadastral da empresa - por isso
// usa a permissao de marketing (que GERENTE tem por padrao) em vez de configuracoes_empresa.
router.put('/minha/cashback', autenticar, exigirPermissao('marketing.gerenciar'), atualizarCashback);
router.get('/minha/ia-config', autenticar, obterConfigIA);
router.put('/minha/ia-config', autenticar, exigirPermissao('agape_ia.gerenciar_config'), atualizarConfigIA);

router.get('/minha/identidade-visual', autenticar, exigirPermissao('configuracoes_empresa.visualizar'), obterIdentidadeVisual);
router.put('/minha/identidade-visual', autenticar, exigirPermissao('configuracoes_empresa.gerenciar'), uploadLogos, atualizarIdentidadeVisual);

router.get('/minha/dados-fiscais', autenticar, exigirPermissao('configuracoes_empresa.visualizar'), obterDadosFiscais);
router.put('/minha/dados-fiscais', autenticar, exigirPermissao('configuracoes_empresa.gerenciar'), atualizarDadosFiscais);

module.exports = router;
