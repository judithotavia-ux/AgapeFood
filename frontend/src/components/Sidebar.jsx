import { NavLink } from 'react-router-dom';

const ITENS_ATIVOS = [
  { to: '/dashboard', label: 'Dashboard', icone: '📊' },
  { to: '/pedidos', label: 'Pedidos', icone: '🛒' },
  { to: '/cardapio', label: 'Cardápio', icone: '🍔' },
  { to: '/cozinha', label: 'Cozinha', icone: '👨‍🍳' },
  { to: '/caixa', label: 'Caixa', icone: '💳' },
  { to: '/salao', label: 'Salão', icone: '🍽️' },
  { to: '/delivery', label: 'Delivery', icone: '🚚' }
];

const ITENS_FUTUROS = [
  { label: 'Estoque', icone: '📦' },
  { label: 'Financeiro', icone: '📈' },
  { label: 'Marketing', icone: '📢' },
  { label: 'Ágape IA', icone: '🤖' }
];

export default function Sidebar() {
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
        <h2 style={{ fontSize: 20 }}>AgapeFood</h2>
        <div style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 2 }}>Painel administrativo</div>
      </div>

      <nav style={{ flex: 1, padding: '14px 0' }}>
        <div style={{ padding: '0 20px', fontSize: 10, letterSpacing: '.08em', color: 'var(--texto2)', marginBottom: 6 }}>PRINCIPAL</div>
        {ITENS_ATIVOS.map((item) => (
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

        <div style={{ padding: '18px 20px 6px', fontSize: 10, letterSpacing: '.08em', color: 'var(--texto2)' }}>EM BREVE</div>
        {ITENS_FUTUROS.map((item) => (
          <div
            key={item.label}
            title="Disponível nas próximas fases"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 20px',
              fontSize: 13,
              color: 'var(--texto2)',
              opacity: 0.55,
              cursor: 'default'
            }}
          >
            <span>{item.icone}</span> {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}
