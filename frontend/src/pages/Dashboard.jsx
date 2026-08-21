import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as empresaService from '../services/empresaService';

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

function fmtPreco(v) {
  return `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
}

function CelulaVendas({ vendas }) {
  if (!vendas) return <span style={{ color: 'var(--texto2)' }}>—</span>;
  return (
    <div>
      <div>{vendas.pedidos} {vendas.pedidos === 1 ? 'pedido' : 'pedidos'}</div>
      <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{fmtPreco(vendas.faturamento)}</div>
    </div>
  );
}

function TabelaIndicadores() {
  const [indicadores, setIndicadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [buscandoPeriodo, setBuscandoPeriodo] = useState(false);

  function carregar(params) {
    setCarregando(true);
    empresaService.obterIndicadores(params).then(setIndicadores).finally(() => { setCarregando(false); setBuscandoPeriodo(false); });
  }

  useEffect(() => { carregar(); }, []);

  function handleBuscarPeriodo(e) {
    e.preventDefault();
    if (!dataInicio || !dataFim) return;
    setBuscandoPeriodo(true);
    carregar({ inicio: dataInicio, fim: dataFim });
  }

  function limparPeriodo() {
    setDataInicio(''); setDataFim('');
    carregar();
  }

  const temPeriodo = indicadores[0]?.vendas?.periodo !== undefined;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15 }}>Empresas — funcionários e vendas</h3>
        <form onSubmit={handleBuscarPeriodo} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 10.5 }}>De</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={{ fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 10.5 }}>Até</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={{ fontSize: 12 }} />
          </div>
          <button type="submit" className="btn-outline" style={{ fontSize: 11.5, padding: '7px 12px' }} disabled={buscandoPeriodo}>
            {buscandoPeriodo ? 'Buscando…' : 'Ver período'}
          </button>
          {temPeriodo && <button type="button" onClick={limparPeriodo} style={{ background: 'none', border: 'none', color: 'var(--texto2)', fontSize: 11.5, cursor: 'pointer' }}>Limpar</button>}
        </form>
      </div>

      {carregando ? <p style={{ color: 'var(--texto2)', fontSize: 12.5 }}>Carregando…</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--borda)' }}>
                <th style={{ padding: '8px 12px' }}>Empresa</th>
                <th style={{ padding: '8px 12px' }}>Funcionários</th>
                <th style={{ padding: '8px 12px' }}>Vendas hoje</th>
                <th style={{ padding: '8px 12px' }}>Últimos 7 dias</th>
                <th style={{ padding: '8px 12px' }}>Mês atual</th>
                {temPeriodo && <th style={{ padding: '8px 12px' }}>Período escolhido</th>}
              </tr>
            </thead>
            <tbody>
              {indicadores.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--borda)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{e.nome}</td>
                  <td style={{ padding: '8px 12px' }}>{e.funcionarios}</td>
                  <td style={{ padding: '8px 12px' }}><CelulaVendas vendas={e.vendas.hoje} /></td>
                  <td style={{ padding: '8px 12px' }}><CelulaVendas vendas={e.vendas.semana} /></td>
                  <td style={{ padding: '8px 12px' }}><CelulaVendas vendas={e.vendas.mes} /></td>
                  {temPeriodo && <td style={{ padding: '8px 12px' }}><CelulaVendas vendas={e.vendas.periodo} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <CartaoStat label="Empresas cadastradas" valor={resumo.totalEmpresas} icone="🏢" />
            <CartaoStat label="Usuários no sistema" valor={resumo.totalUsuarios} icone="👥" />
          </div>
          <TabelaIndicadores />
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <CartaoStat label="Pedidos hoje" valor={resumo?.pedidosHoje ?? '—'} icone="🛒" />
            <CartaoStat label="Faturamento hoje" valor={resumo ? `R$ ${resumo.faturamentoHoje.toFixed(2)}` : '—'} icone="💰" />
            <CartaoStat label="Pedidos pendentes" valor={resumo?.pedidosPendentes ?? '—'} icone="⏳" />
            <CartaoStat label="Equipe" valor={resumo?.totalUsuariosEmpresa ?? '—'} icone="👥" />
          </div>
          <Link to="/pedidos" className="card" style={{ display: 'block', fontSize: 13, color: 'var(--dourado)', textDecoration: 'none' }}>
            🛒 Ver todos os pedidos →
          </Link>
        </>
      )}
    </AdminLayout>
  );
}
