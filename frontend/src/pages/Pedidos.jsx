import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import * as pedidoService from '../services/pedidoService';
import { STATUS_LABEL, STATUS_COR, PROXIMO_STATUS, TIPO_LABEL, PAGAMENTO_LABEL, CANAL_LABEL, fmtPreco } from '../utils/pedidoConstantes';

const FILTROS = ['TODOS', 'RECEBIDO', 'PREPARANDO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO'];

function Badge({ status }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: STATUS_COR[status] + '22', color: STATUS_COR[status]
    }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function Pedidos() {
  const location = useLocation();
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState(location.state?.pedidoCriado ? `Pedido #${location.state.pedidoCriado} criado com sucesso!` : '');

  async function carregar() {
    setCarregando(true);
    const dados = await pedidoService.listarPedidos(filtro !== 'TODOS' ? { status: filtro } : {});
    setPedidos(dados);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [filtro]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  async function avancarStatus(pedido, novoStatus) {
    await pedidoService.atualizarStatusPedido(pedido.id, novoStatus);
    carregar();
  }

  async function cancelar(pedido) {
    if (!confirm(`Cancelar o pedido #${pedido.numero}?`)) return;
    await pedidoService.cancelarPedido(pedido.id);
    carregar();
  }

  return (
    <AdminLayout titulo="Pedidos">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTROS.map((f) => (
            <button
              key={f}
              className="ans-btn"
              onClick={() => setFiltro(f)}
              style={filtro === f ? { background: 'var(--dourado)', color: '#16130a', borderColor: 'var(--dourado)' } : {}}
            >
              {f === 'TODOS' ? 'Todos' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <Link to="/pedidos/novo" className="btn">+ Novo pedido</Link>
      </div>

      {aviso && <div className="card" style={{ borderColor: 'var(--sucesso)', color: 'var(--sucesso)', marginBottom: 14, fontSize: 13 }}>✓ {aviso}</div>}

      {carregando && <p style={{ color: 'var(--texto2)' }}>Carregando pedidos…</p>}

      {!carregando && !pedidos.length && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)' }}>Nenhum pedido encontrado.</div>
      )}

      {pedidos.map((p) => (
        <div key={p.id} className="card" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <strong style={{ color: 'var(--dourado)' }}>#{p.numero}</strong>
              <span style={{ fontSize: 12 }}>{TIPO_LABEL[p.tipo]}{p.mesa ? ` — Mesa ${p.mesa.numero}` : ''}</span>
              <Badge status={p.status} />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--texto2)' }}>
              {p.clienteNome || 'Cliente não identificado'}{p.clienteTelefone ? ` · ${p.clienteTelefone}` : ''}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--texto2)', marginTop: 2 }}>
              {p.itens.length} item(ns) · {p.formaPagamento ? PAGAMENTO_LABEL[p.formaPagamento] : '—'} · {new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {p.canalEntrega && <> · {CANAL_LABEL[p.canalEntrega]}{p.motoboy ? ` (${p.motoboy.nome})` : ''}</>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(p.valorTotal)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(PROXIMO_STATUS[p.status] || []).map((novoStatus) => (
                <button key={novoStatus} className="btn-outline" style={{ fontSize: 11.5, padding: '7px 12px', borderRadius: 8 }} onClick={() => avancarStatus(p, novoStatus)}>
                  {STATUS_LABEL[novoStatus]} →
                </button>
              ))}
              {!['ENTREGUE', 'CANCELADO'].includes(p.status) && (
                <button style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 11.5, cursor: 'pointer' }} onClick={() => cancelar(p)}>Cancelar</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </AdminLayout>
  );
}
