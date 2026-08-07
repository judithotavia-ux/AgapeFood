import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ titulo }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  function handleSair() {
    sair();
    navigate('/login');
  }

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      borderBottom: '1px solid var(--borda)',
      background: 'var(--preto)'
    }}>
      <h3 style={{ fontSize: 17 }}>{titulo}</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--texto)' }}>{usuario?.nome}</div>
          <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{usuario?.papel} {usuario?.empresa ? '· ' + usuario.empresa.nome : ''}</div>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--dourado)', color: '#16130a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13
        }}>
          {usuario?.nome ? usuario.nome[0].toUpperCase() : '?'}
        </div>
        <button className="btn-outline" style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8 }} onClick={handleSair}>Sair</button>
      </div>
    </header>
  );
}
