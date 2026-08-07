require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { initSocket } = require('./realtime/socket');

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

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, servico: 'AgapeFood API' }));

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

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 3333;
httpServer.listen(PORT, () => console.log(`AgapeFood API rodando em http://localhost:${PORT}`));
