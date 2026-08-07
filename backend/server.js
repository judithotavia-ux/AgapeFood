require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const produtoRoutes = require('./routes/produto.routes');
const publicoRoutes = require('./routes/publico.routes');
const pedidoRoutes = require('./routes/pedido.routes');
const mesaRoutes = require('./routes/mesa.routes');

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

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`AgapeFood API rodando em http://localhost:${PORT}`));
