import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function CartaoStat({ label, valor, icone }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 26 }}>{icone}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--dourado)' }}>{valor}</div>
        <div style={{ fontSize: 12, color: 'var(--texto2)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    api.get('/dashboard/resumo').then((r) => setResumo(r.data)).catch(() => setResumo(null));
  }, []);

  return (
    <AdminLayout titulo="Dashboard">
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>Olá, {usuario?.nome?.split(' ')[0]} 👋</h2>
      <p style={{ color: 'var(--texto2)', fontSize: 13, marginBottom: 24 }}>
        Bem-vindo ao painel da {usuario?.empresa?.nome || 'AgapeFood'}.
      </p>

      {resumo?.escopo === 'saas' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <CartaoStat label="Empresas cadastradas" valor={resumo.totalEmpresas} icone="🏢" />
          <CartaoStat label="Usuários no sistema" valor={resumo.totalUsuarios} icone="👥" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <CartaoStat label="Pedidos hoje" valor={resumo?.pedidosHoje ?? '—'} icone="🛒" />
            <CartaoStat label="Faturamento hoje" valor={resumo ? `R$ ${resumo.faturamentoHoje.toFixed(2)}` : '—'} icone="💰" />
            <CartaoStat label="Equipe" valor={resumo?.totalUsuariosEmpresa ?? '—'} icone="👥" />
          </div>
          <div className="card" style={{ fontSize: 13, color: 'var(--texto2)' }}>
            🚧 {resumo?.aviso || 'Os módulos de Cardápio, Pedidos e Delivery chegam nas próximas fases.'}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
