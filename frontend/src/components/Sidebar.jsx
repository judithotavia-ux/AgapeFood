import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ITEM_EMPRESAS = { to: '/empresas', label: 'Empresas', icone: '🏢' };

const ITENS_ATIVOS = [
  { to: '/dashboard', label: 'Dashboard', icone: '📊' },
  { to: '/agape-ia', label: 'Ágape IA', icone: '🤖' },
  { to: '/central-pedidos', label: 'Central de Pedidos', icone: '🔔' },
  { to: '/pedidos', label: 'Pedidos', icone: '🛒' },
  { to: '/garcons', label: 'Garçons', icone: '🧑‍🍳' },
  { to: '/equipe-garcons', label: 'Equipe de Garçons', icone: '🪪' },
  { to: '/fechamento-gorjetas', label: 'Fechamento de Gorjetas', icone: '💰' },
  { to: '/aprovacoes-gerenciais', label: 'Aprovações Gerenciais', icone: '🔐' },
  { to: '/perfis-personalizados', label: 'Perfis Personalizados', icone: '🧩' },
  { to: '/log-auditoria', label: 'Log de Auditoria', icone: '📜' },
  { to: '/identidade-visual', label: 'Identidade Visual', icone: '🎨' },
  { to: '/dados-fiscais', label: 'Dados Fiscais', icone: '🧾' },
  { to: '/meu-desempenho', label: 'Minhas Vendas e Gorjetas', icone: '📈' },
  { to: '/cardapio', label: 'Cardápio', icone: '🍔' },
  { to: '/cozinha', label: 'Cozinha', icone: '👨‍🍳' },
  { to: '/caixa', label: 'Caixa', icone: '💳' },
  { to: '/salao', label: 'Salão', icone: '🍽️' },
  { to: '/delivery', label: 'Delivery', icone: '🚚' },
  { to: '/estoque', label: 'Estoque', icone: '📦' },
  { to: '/financeiro', label: 'Financeiro', icone: '📈' },
  { to: '/marketing', label: 'Marketing', icone: '📢' },
  { to: '/central-impressao', label: 'Central de Impressão', icone: '🖨️' },
  { to: '/impressoras', label: 'Impressoras', icone: '⚙️' },
  { to: '/assinatura', label: 'Assinatura', icone: '💳' }
];

export default function Sidebar() {
  const { usuario } = useAuth();
  const empresa = usuario?.empresa;
  const superAdmin = usuario?.papel === 'SUPER_ADMIN';
  const visaoGeral = superAdmin && !empresa;

  // Super admin sem empresa selecionada: so faz sentido ver Dashboard (visao da plataforma) e a
  // lista de Empresas. As telas de baixo (Caixa, Garçons etc.) so tem dado depois de "entrar" numa.
  const itens = visaoGeral
    ? [ITENS_ATIVOS[0], ITEM_EMPRESAS]
    : superAdmin
      ? [ITENS_ATIVOS[0], ITEM_EMPRESAS, ...ITENS_ATIVOS.slice(1)]
      : ITENS_ATIVOS;

  return (
    <aside style={{
      width: 230,
      background: 'var(--preto2)',
      borderRight: '1px solid var(--borda)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      <div style={{ padding: '22px 20px', borderBottom: '1px solid var(--borda)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {empresa?.logoUrl && <img src={empresa.logoUrl} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />}
          <h2 style={{ fontSize: 20 }}>{empresa?.nome || 'AgapeFood'}</h2>
        </div>
        <div style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 2 }}>
          {empresa?.slogan || (visaoGeral ? 'Visão geral da plataforma' : 'Painel administrativo')}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '14px 0' }}>
        <div style={{ padding: '0 20px', fontSize: 10, letterSpacing: '.08em', color: 'var(--texto2)', marginBottom: 6 }}>PRINCIPAL</div>
        {itens.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              fontSize: 13.5,
              textDecoration: 'none',
              color: isActive ? 'var(--dourado)' : 'var(--texto)',
              background: isActive ? 'rgba(212,175,55,.1)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--dourado)' : '3px solid transparent'
            })}
          >
            <span>{item.icone}</span> {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
