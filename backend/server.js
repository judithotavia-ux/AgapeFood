require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { initSocket } = require('./realtime/socket');
const prisma = require('./prisma/client');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const produtoRoutes = require('./routes/produto.routes');
const publicoRoutes = require('./routes/publico.routes');
const pedidoRoutes = require('./routes/pedido.routes');
const mesaRoutes = require('./routes/mesa.routes');
const caixaRoutes = require('./routes/caixa.routes');
const reservaRoutes = require('./routes/reserva.routes');
const motoboyRoutes = require('./routes/motoboy.routes');
const zonaEntregaRoutes = require('./routes/zonaEntrega.routes');
const canalEntregaRoutes = require('./routes/canalEntrega.routes');
const webhookRoutes = require('./routes/webhook.routes');
const empresaRoutes = require('./routes/empresa.routes');
const utilitarioRoutes = require('./routes/utilitario.routes');
const fornecedorRoutes = require('./routes/fornecedor.routes');
const movimentacaoEstoqueRoutes = require('./routes/movimentacaoEstoque.routes');
const loteRoutes = require('./routes/lote.routes');
const estoqueDashboardRoutes = require('./routes/estoqueDashboard.routes');
const categoriaFinanceiraRoutes = require('./routes/categoriaFinanceira.routes');
const contaPagarRoutes = require('./routes/contaPagar.routes');
const contaReceberRoutes = require('./routes/contaReceber.routes');
const financeiroDashboardRoutes = require('./routes/financeiroDashboard.routes');
const clienteRoutes = require('./routes/cliente.routes');
const cupomRoutes = require('./routes/cupom.routes');
const campanhaRoutes = require('./routes/campanha.routes');
const avaliacaoRoutes = require('./routes/avaliacao.routes');
const marketingDashboardRoutes = require('./routes/marketingDashboard.routes');
const iaMarketingRoutes = require('./routes/iaMarketing.routes');
const impressoraRoutes = require('./routes/impressora.routes');
const printJobRoutes = require('./routes/printJob.routes');
const impressaoDashboardRoutes = require('./routes/impressaoDashboard.routes');
const assinaturaRoutes = require('./routes/assinatura.routes');
const webhookAsaasRoutes = require('./routes/webhookAsaas.routes');
const agapeIaRoutes = require('./routes/agapeIa.routes');
const clienteAuthRoutes = require('./routes/clienteAuth.routes');
const clientePortalRoutes = require('./routes/clientePortal.routes');
const garcomRoutes = require('./routes/garcom.routes');
const configuracaoGorjetaRoutes = require('./routes/configuracaoGorjeta.routes');
const fechamentoGorjetaRoutes = require('./routes/fechamentoGorjeta.routes');
const permissaoRoutes = require('./routes/permissao.routes');
const limiteAprovacaoRoutes = require('./routes/limiteAprovacao.routes');
const perfilPersonalizadoRoutes = require('./routes/perfilPersonalizado.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const permissaoTemporariaRoutes = require('./routes/permissaoTemporaria.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');

function logErroEstruturado(origem, err, req) {
  console.error(JSON.stringify({
    nivel: 'erro',
    origem,
    quando: new Date().toISOString(),
    mensagem: err?.message || String(err),
    metodo: req?.method,
    rota: req?.originalUrl,
    empresaId: req?.usuario?.empresaId || null,
    stack: err?.stack
  }));
}

// Express 4 nao repassa rejeicoes de handlers async pro error handler abaixo;
// sem isso, uma rejeicao nao tratada em qualquer rota derruba o processo inteiro.
process.on('unhandledRejection', (err) => {
  logErroEstruturado('unhandledRejection', err);
});
process.on('uncaughtException', (err) => {
  logErroEstruturado('uncaughtException', err);
});

const app = express();

// Alem da URL fixa de producao (CORS_ORIGIN), libera qualquer preview deploy da Vercel
// deste projeto (ex: agape-food-<hash>-<time>.vercel.app) - a Vercel gera uma URL unica
// por deploy, entao uma lista fixa de origens quebraria a cada novo deploy.
const ORIGEM_PRODUCAO = process.env.CORS_ORIGIN;
const REGEX_PREVIEW_VERCEL = /^https:\/\/agape-food-[\w-]+\.vercel\.app$/;

function origemPermitidaCors(origin, callback) {
  if (!origin) return callback(null, true);
  if (!ORIGEM_PRODUCAO) return callback(null, true);
  if (origin === ORIGEM_PRODUCAO || origin === 'http://localhost:5173' || REGEX_PREVIEW_VERCEL.test(origin)) {
    return callback(null, true);
  }
  callback(new Error('Origem não permitida pelo CORS.'));
}

app.use(cors({ origin: origemPermitidaCors }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, servico: 'AgapeFood API', banco: 'ok' });
  } catch (e) {
    logErroEstruturado('health-check-db', e, req);
    res.status(503).json({ ok: false, servico: 'AgapeFood API', banco: 'indisponível' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/publico', publicoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/caixa', caixaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/motoboys', motoboyRoutes);
app.use('/api/zonas-entrega', zonaEntregaRoutes);
app.use('/api/canais-entrega', canalEntregaRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/utilitarios', utilitarioRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/movimentacoes-estoque', movimentacaoEstoqueRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/estoque', estoqueDashboardRoutes);
app.use('/api/categorias-financeiras', categoriaFinanceiraRoutes);
app.use('/api/contas-pagar', contaPagarRoutes);
app.use('/api/contas-receber', contaReceberRoutes);
app.use('/api/financeiro', financeiroDashboardRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/cupons', cupomRoutes);
app.use('/api/campanhas', campanhaRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/marketing', marketingDashboardRoutes);
app.use('/api/ia-marketing', iaMarketingRoutes);
app.use('/api/impressoras', impressoraRoutes);
app.use('/api/print-jobs', printJobRoutes);
app.use('/api/impressao', impressaoDashboardRoutes);
app.use('/api/assinatura', assinaturaRoutes);
app.use('/api/webhooks/asaas', webhookAsaasRoutes);
app.use('/api/agape-ia', agapeIaRoutes);
app.use('/api/cliente-auth', clienteAuthRoutes);
app.use('/api/cliente-portal', clientePortalRoutes);
app.use('/api/garcons', garcomRoutes);
app.use('/api/configuracao-gorjeta', configuracaoGorjetaRoutes);
app.use('/api/fechamentos-gorjeta', fechamentoGorjetaRoutes);
app.use('/api/permissoes', permissaoRoutes);
app.use('/api/limites-aprovacao', limiteAprovacaoRoutes);
app.use('/api/perfis-personalizados', perfilPersonalizadoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/permissoes-temporarias', permissaoTemporariaRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logErroEstruturado('express-error-handler', err, req);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 3333;
httpServer.listen(PORT, () => console.log(`AgapeFood API rodando em http://localhost:${PORT}`));
