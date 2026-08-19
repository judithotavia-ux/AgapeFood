import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import * as pedidoService from '../services/pedidoService';
import { obterSocket } from '../services/socket';
import { useAlertaPedidos } from '../context/AlertaPedidosContext';
import {
  STATUS_LABEL, STATUS_COR, PROXIMO_STATUS, TIPO_LABEL, CANAL_LABEL, fmtPreco
} from '../utils/pedidoConstantes';
import { obterVolume, definirVolume, pedirPermissaoNotificacao, obterPermissaoNotificacao } from '../utils/alertas';

const STATUS_ATIVOS = ['RECEBIDO', 'PREPARANDO', 'PRONTO', 'SAIU_PARA_ENTREGA'];

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

export default function CentralPedidos() {
  const { naoReconhecidos: pedidosNaoReconhecidos, reconhecer } = useAlertaPedidos();
  const naoReconhecidos = pedidosNaoReconhecidos.map((p) => p.id);
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [volume, setVolume] = useState(obterVolume());
  const [permissaoNotif, setPermissaoNotif] = useState(obterPermissaoNotificacao());
  const [conectado, setConectado] = useState(false);
  const pedidosRef = useRef([]);

  async function carregar() {
    setCarregando(true);
    const dados = await pedidoService.listarPedidos();
    const ativos = dados.filter((p) => STATUS_ATIVOS.includes(p.status));
    pedidosRef.current = ativos;
    setPedidos(ativos);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();

    const socket = obterSocket();
    if (!socket) return;

    setConectado(socket.connected);
    const aoConectar = () => setConectado(true);
    const aoDesconectar = () => setConectado(false);

    function aoReceberNovo(pedido) {
      pedidosRef.current = [pedido, ...pedidosRef.current];
      setPedidos(pedidosRef.current);
    }

    function aoAtualizar(pedidoAtualizado) {
      const aindaAtivo = STATUS_ATIVOS.includes(pedidoAtualizado.status);
      const existiaAntes = pedidosRef.current.some((p) => p.id === pedidoAtualizado.id);

      if (!aindaAtivo) {
        pedidosRef.current = pedidosRef.current.filter((p) => p.id !== pedidoAtualizado.id);
      } else if (existiaAntes) {
        pedidosRef.current = pedidosRef.current.map((p) => (p.id === pedidoAtualizado.id ? { ...p, ...pedidoAtualizado } : p));
      } else {
        pedidosRef.current = [pedidoAtualizado, ...pedidosRef.current];
      }
      setPedidos([...pedidosRef.current]);
    }

    socket.on('connect', aoConectar);
    socket.on('disconnect', aoDesconectar);
    socket.on('pedido:novo', aoReceberNovo);
    socket.on('pedido:atualizado', aoAtualizar);

    return () => {
      socket.off('connect', aoConectar);
      socket.off('disconnect', aoDesconectar);
      socket.off('pedido:novo', aoReceberNovo);
      socket.off('pedido:atualizado', aoAtualizar);
    };
  }, []);

  async function avancarStatus(pedido, novoStatus) {
    reconhecer(pedido.id);
    await pedidoService.atualizarStatusPedido(pedido.id, novoStatus);
  }

  function alterarVolume(v) {
    setVolume(v);
    definirVolume(v);
  }

  async function ativarNotificacoes() {
    const permissao = await pedirPermissaoNotificacao();
    setPermissaoNotif(permissao);
  }

  const contagem = STATUS_ATIVOS.reduce((acc, s) => ({ ...acc, [s]: pedidos.filter((p) => p.status === s).length }), {});

  if (carregando) return <AdminLayout titulo="Central de Pedidos"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;

  return (
    <AdminLayout titulo="Central de Pedidos">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: conectado ? 'var(--sucesso)' : 'var(--erro)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: conectado ? 'var(--sucesso)' : 'var(--erro)', display: 'inline-block' }} />
          {conectado ? 'Tempo real conectado' : 'Reconectando…'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--texto2)' }}>🔊</span>
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => alterarVolume(Number(e.target.value))} style={{ width: 100 }} />
          </div>
          {permissaoNotif !== 'granted' && permissaoNotif !== 'unsupported' && (
            <button className="btn-outline" style={{ fontSize: 11.5, padding: '7px 12px', borderRadius: 8 }} onClick={ativarNotificacoes}>
              Ativar notificações
            </button>
          )}
          {permissaoNotif === 'granted' && <span style={{ fontSize: 11.5, color: 'var(--sucesso)' }}>🔔 Notificações ativas</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
        {STATUS_ATIVOS.map((s) => (
          <div key={s} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: STATUS_COR[s] }}>{contagem[s] || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--texto2)' }}>{STATUS_LABEL[s]}</div>
          </div>
        ))}
      </div>

      {naoReconhecidos.length > 0 && (
        <div className="card" style={{ marginBottom: 18, borderColor: 'var(--erro)' }}>
          <h3 style={{ fontSize: 15, marginBottom: 12, color: 'var(--erro)' }}>🔔 Aguardando reconhecimento ({naoReconhecidos.length})</h3>
          {pedidos.filter((p) => naoReconhecidos.includes(p.id)).map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--borda)' }}>
              <div>
                <strong style={{ color: 'var(--dourado)' }}>#{p.numero}</strong>
                <span style={{ fontSize: 12.5, marginLeft: 10 }}>{TIPO_LABEL[p.tipo]}{p.mesa ? ` — Mesa ${p.mesa.numero}` : ''}{p.clienteNome ? ` · ${p.clienteNome}` : ''}</span>
              </div>
              <button className="btn" style={{ fontSize: 11.5, padding: '7px 14px' }} onClick={() => reconhecer(p.id)}>Reconhecer</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Pedidos ativos</h3>
        {!pedidos.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum pedido ativo no momento.</p>}
        {pedidos.map((p) => (
          <div key={p.id} className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderColor: naoReconhecidos.includes(p.id) ? 'var(--erro)' : undefined }}>
            <div style={{ minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <strong style={{ color: 'var(--dourado)' }}>#{p.numero}</strong>
                <span style={{ fontSize: 12 }}>{TIPO_LABEL[p.tipo]}{p.mesa ? ` — Mesa ${p.mesa.numero}` : ''}</span>
                <Badge status={p.status} />
                {p.canalEntrega && <span style={{ fontSize: 11, color: 'var(--texto2)' }}>{CANAL_LABEL[p.canalEntrega]}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--texto2)' }}>
                {p.clienteNome || 'Cliente não identificado'} · {new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(p.valorTotal)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(PROXIMO_STATUS[p.status] || []).map((novoStatus) => (
                  <button key={novoStatus} className="btn-outline" style={{ fontSize: 11.5, padding: '7px 12px', borderRadius: 8 }} onClick={() => avancarStatus(p, novoStatus)}>
                    {STATUS_LABEL[novoStatus]} →
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
