import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dourado)' }}>
        Carregando…
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;

  return children;
}
