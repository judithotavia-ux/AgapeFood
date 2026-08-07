import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RotaProtegida from './components/RotaProtegida';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cardapio from './pages/Cardapio';
import CardapioPublico from './pages/CardapioPublico';
import Pedidos from './pages/Pedidos';
import NovoPedido from './pages/NovoPedido';
import Cozinha from './pages/Cozinha';
import Caixa from './pages/Caixa';
import Salao from './pages/Salao';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cardapio/:slug" element={<CardapioPublico />} />
          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          />
          <Route
            path="/cardapio"
            element={
              <RotaProtegida>
                <Cardapio />
              </RotaProtegida>
            }
          />
          <Route
            path="/pedidos"
            element={
              <RotaProtegida>
                <Pedidos />
              </RotaProtegida>
            }
          />
          <Route
            path="/pedidos/novo"
            element={
              <RotaProtegida>
                <NovoPedido />
              </RotaProtegida>
            }
          />
          <Route
            path="/cozinha"
            element={
              <RotaProtegida>
                <Cozinha />
              </RotaProtegida>
            }
          />
          <Route
            path="/caixa"
            element={
              <RotaProtegida>
                <Caixa />
              </RotaProtegida>
            }
          />
          <Route
            path="/salao"
            element={
              <RotaProtegida>
                <Salao />
              </RotaProtegida>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
