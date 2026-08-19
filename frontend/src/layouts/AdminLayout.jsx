import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/authService';

export default function AdminLayout({ titulo, children }) {
  const { usuario, entrarComToken } = useAuth();
  const navigate = useNavigate();

  const tokenSuperAdmin = authService.tokenSuperAdminSalvo();
  const visualizandoComoEmpresa = usuario?.papel === 'SUPER_ADMIN' && usuario?.empresa && tokenSuperAdmin;

  async function handleVoltar() {
    authService.limparTokenSuperAdmin();
    await entrarComToken(tokenSuperAdmin);
    navigate('/empresas');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {visualizandoComoEmpresa && (
          <div style={{
            background: '#3a2a06', color: '#ffd76a', padding: '8px 20px', fontSize: 12.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>Visualizando como <strong>{usuario.empresa.nome}</strong> (modo super admin)</span>
            <button
              onClick={handleVoltar}
              style={{ background: 'transparent', border: '1px solid #ffd76a', color: '#ffd76a', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
            >
              Voltar para visão geral
            </button>
          </div>
        )}
        <Topbar titulo={titulo} />
        <main style={{ padding: 28, flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
