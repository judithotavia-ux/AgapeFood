import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as pedidoService from '../services/pedidoService';
import { obterSocket } from '../services/socket';
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
  const [linkCopiado, setLinkCopiado] = useState(null);

  const [modalDesconto, setModalDesconto] = useState(null);
  const [tipoDesconto, setTipoDesconto] = useState('PERCENTUAL');
  const [valorDesconto, setValorDesconto] = useState('');
  const [motivoDesconto, setMotivoDesconto] = useState('');
  const [erroDesconto, setErroDesconto] = useState('');
  const [enviandoDesconto, setEnviandoDesconto] = useState(false);

  const [modalPin, setModalPin] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [erroPin, setErroPin] = useState('');
  const [enviandoPin, setEnviandoPin] = useState(false);

  async function carregar() {
    setCarregando(true);
    const dados = await pedidoService.listarPedidos(filtro !== 'TODOS' ? { status: filtro } : {});
    setPedidos(dados);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [filtro]);

  useEffect(() => {
    const socket = obterSocket();
    socket?.on('pedido:novo', carregar);
    socket?.on('pedido:atualizado', carregar);
    return () => {
      socket?.off('pedido:novo', carregar);
      socket?.off('pedido:atualizado', carregar);
    };
  }, [filtro]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  async function avancarStatus(pedido, novoStatus) {
    await pedidoService.atualizarStatusPedido(pedido.id, novoStatus);
    carregar();
  }

  async function executarCancelar(pedido, pinAprovador) {
    try {
      await pedidoService.cancelarPedido(pedido.id, pinAprovador ? { pinAprovador } : {});
      setModalPin(null);
      setPinInput('');
      carregar();
    } catch (e) {
      if (e.response?.data?.requerAprovacao && !pinAprovador) {
        setErroPin('');
        setModalPin({ tipo: 'cancelar', pedido });
      } else if (pinAprovador) {
        setErroPin(e.response?.data?.erro || 'PIN inválido.');
      } else {
        alert(e.response?.data?.erro || 'Não foi possível cancelar.');
      }
    }
  }

  function cancelar(pedido) {
    if (!confirm(`Cancelar o pedido #${pedido.numero}?`)) return;
    executarCancelar(pedido, null);
  }

  function abrirModalDesconto(pedido) {
    setModalDesconto(pedido);
    setTipoDesconto('PERCENTUAL');
    setValorDesconto('');
    setMotivoDesconto('');
    setErroDesconto('');
  }

  async function executarDesconto(pinAprovador) {
    setEnviandoDesconto(true);
    setErroDesconto('');
    try {
      await pedidoService.aplicarDescontoPedido(modalDesconto.id, {
        tipo: tipoDesconto,
        valor: Number(valorDesconto),
        motivo: motivoDesconto || undefined,
        ...(pinAprovador ? { pinAprovador } : {})
      });
      setModalDesconto(null);
      setModalPin(null);
      setPinInput('');
      carregar();
    } catch (e) {
      if (e.response?.data?.requerAprovacao && !pinAprovador) {
        setErroPin('');
        setModalPin({ tipo: 'desconto' });
      } else if (pinAprovador) {
        setErroPin(e.response?.data?.erro || 'PIN inválido.');
      } else {
        setErroDesconto(e.response?.data?.erro || 'Não foi possível aplicar o desconto.');
      }
    } finally {
      setEnviandoDesconto(false);
    }
  }

  async function confirmarPin() {
    setEnviandoPin(true);
    if (modalPin.tipo === 'cancelar') {
      await executarCancelar(modalPin.pedido, pinInput);
    } else {
      await executarDesconto(pinInput);
    }
    setEnviandoPin(false);
  }

  async function copiarLinkAvaliacao(pedido) {
    const link = `${window.location.origin}/avaliacao/${pedido.id}`;
    await navigator.clipboard.writeText(link);
    setLinkCopiado(pedido.id);
    setTimeout(() => setLinkCopiado(null), 2500);
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
                <>
                  <button style={{ background: 'none', border: 'none', color: 'var(--dourado)', fontSize: 11.5, cursor: 'pointer' }} onClick={() => abrirModalDesconto(p)}>% Desconto</button>
                  <button style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 11.5, cursor: 'pointer' }} onClick={() => cancelar(p)}>Cancelar</button>
                </>
              )}
              {p.status === 'ENTREGUE' && (
                <button style={{ background: 'none', border: 'none', color: 'var(--dourado)', fontSize: 11.5, cursor: 'pointer' }} onClick={() => copiarLinkAvaliacao(p)}>
                  {linkCopiado === p.id ? '✓ Link copiado!' : '⭐ Link de avaliação'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <Modal titulo={`Aplicar desconto — Pedido #${modalDesconto?.numero || ''}`} aberto={!!modalDesconto} onFechar={() => setModalDesconto(null)}>
        {modalDesconto && (
          <form onSubmit={(e) => { e.preventDefault(); executarDesconto(null); }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button type="button" className="ans-btn" style={tipoDesconto === 'PERCENTUAL' ? { background: 'var(--dourado)', color: '#16130a', borderColor: 'var(--dourado)' } : {}} onClick={() => setTipoDesconto('PERCENTUAL')}>% Percentual</button>
              <button type="button" className="ans-btn" style={tipoDesconto === 'VALOR' ? { background: 'var(--dourado)', color: '#16130a', borderColor: 'var(--dourado)' } : {}} onClick={() => setTipoDesconto('VALOR')}>R$ Valor fixo</button>
            </div>
            <label>{tipoDesconto === 'PERCENTUAL' ? 'Percentual de desconto' : 'Valor do desconto (R$)'}</label>
            <input type="number" min="0" step="0.01" value={valorDesconto} onChange={(e) => setValorDesconto(e.target.value)} required autoFocus style={{ marginBottom: 12 }} />
            <label>Motivo (opcional)</label>
            <input type="text" value={motivoDesconto} onChange={(e) => setMotivoDesconto(e.target.value)} placeholder="Ex: cliente fidelizado" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 12 }}>Total atual do pedido: {fmtPreco(modalDesconto.valorTotal)}</div>
            {erroDesconto && <div className="erro-msg" style={{ marginBottom: 12 }}>{erroDesconto}</div>}
            <button type="submit" className="btn" style={{ width: '100%' }} disabled={enviandoDesconto}>{enviandoDesconto ? 'Aplicando…' : 'Aplicar desconto'}</button>
          </form>
        )}
      </Modal>

      <Modal titulo="Aprovação necessária" aberto={!!modalPin} onFechar={() => { setModalPin(null); setPinInput(''); setErroPin(''); }} largura={360}>
        {modalPin && (
          <form onSubmit={(e) => { e.preventDefault(); confirmarPin(); }}>
            <p style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 14 }}>
              {modalPin.tipo === 'cancelar'
                ? 'Você não tem permissão pra cancelar este pedido. Peça o PIN de um gerente pra aprovar.'
                : 'Esse desconto passa do seu limite. Peça o PIN de um gerente pra aprovar.'}
            </p>
            <label>PIN do gerente</label>
            <input
              type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              required autoFocus style={{ marginBottom: 12, textAlign: 'center', letterSpacing: '.3em', fontSize: 20 }}
            />
            {erroPin && <div className="erro-msg" style={{ marginBottom: 12 }}>{erroPin}</div>}
            <button type="submit" className="btn" style={{ width: '100%' }} disabled={enviandoPin}>{enviandoPin ? 'Verificando…' : 'Confirmar'}</button>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}
