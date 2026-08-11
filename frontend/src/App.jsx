import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RotaProtegida from './components/RotaProtegida';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cardapio from './pages/Cardapio';
import CardapioPublico from './pages/CardapioPublico';
import Pedidos from './pages/Pedidos';
import NovoPedido from './pages/NovoPedido';
import CentralPedidos from './pages/CentralPedidos';
import Garcons from './pages/Garcons';
import Cozinha from './pages/Cozinha';
import Caixa from './pages/Caixa';
import Salao from './pages/Salao';
import Delivery from './pages/Delivery';
import Estoque from './pages/Estoque';
import Financeiro from './pages/Financeiro';
import Marketing from './pages/Marketing';
import AvaliacaoPublica from './pages/AvaliacaoPublica';
import Impressoras from './pages/Impressoras';
import CentralImpressao from './pages/CentralImpressao';
import TermosDeUso from './pages/TermosDeUso';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import Assinatura from './pages/Assinatura';
import CadastroEmpresa from './pages/CadastroEmpresa';
import AgapeIAChat from './pages/AgapeIAChat';
import AgapeIADashboard from './pages/AgapeIADashboard';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import EquipeGarcons from './pages/EquipeGarcons';
import FechamentoGorjetas from './pages/FechamentoGorjetas';
import MeuDesempenho from './pages/MeuDesempenho';
import AprovacoesGerenciais from './pages/AprovacoesGerenciais';
import PerfisPersonalizados from './pages/PerfisPersonalizados';
import LogAuditoria from './pages/LogAuditoria';
import IdentidadeVisual from './pages/IdentidadeVisual';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/cadastro-empresa" element={<CadastroEmpresa />} />
          <Route path="/cardapio/:slug" element={<CardapioPublico />} />
          <Route path="/avaliacao/:pedidoId" element={<AvaliacaoPublica />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
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
            path="/central-pedidos"
            element={
              <RotaProtegida>
                <CentralPedidos />
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
            path="/garcons"
            element={
              <RotaProtegida>
                <Garcons />
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
          <Route
            path="/delivery"
            element={
              <RotaProtegida>
                <Delivery />
              </RotaProtegida>
            }
          />
          <Route
            path="/estoque"
            element={
              <RotaProtegida>
                <Estoque />
              </RotaProtegida>
            }
          />
          <Route
            path="/financeiro"
            element={
              <RotaProtegida>
                <Financeiro />
              </RotaProtegida>
            }
          />
          <Route
            path="/marketing"
            element={
              <RotaProtegida>
                <Marketing />
              </RotaProtegida>
            }
          />
          <Route
            path="/impressoras"
            element={
              <RotaProtegida>
                <Impressoras />
              </RotaProtegida>
            }
          />
          <Route
            path="/central-impressao"
            element={
              <RotaProtegida>
                <CentralImpressao />
              </RotaProtegida>
            }
          />
          <Route
            path="/assinatura"
            element={
              <RotaProtegida>
                <Assinatura />
              </RotaProtegida>
            }
          />
          <Route
            path="/equipe-garcons"
            element={
              <RotaProtegida>
                <EquipeGarcons />
              </RotaProtegida>
            }
          />
          <Route
            path="/meu-desempenho"
            element={
              <RotaProtegida>
                <MeuDesempenho />
              </RotaProtegida>
            }
          />
          <Route
            path="/fechamento-gorjetas"
            element={
              <RotaProtegida>
                <FechamentoGorjetas />
              </RotaProtegida>
            }
          />
          <Route
            path="/aprovacoes-gerenciais"
            element={
              <RotaProtegida>
                <AprovacoesGerenciais />
              </RotaProtegida>
            }
          />
          <Route
            path="/perfis-personalizados"
            element={
              <RotaProtegida>
                <PerfisPersonalizados />
              </RotaProtegida>
            }
          />
          <Route
            path="/log-auditoria"
            element={
              <RotaProtegida>
                <LogAuditoria />
              </RotaProtegida>
            }
          />
          <Route
            path="/identidade-visual"
            element={
              <RotaProtegida>
                <IdentidadeVisual />
              </RotaProtegida>
            }
          />
          <Route
            path="/agape-ia"
            element={
              <RotaProtegida>
                <AgapeIAChat />
              </RotaProtegida>
            }
          />
          <Route
            path="/agape-ia/dashboard"
            element={
              <RotaProtegida>
                <AgapeIADashboard />
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
