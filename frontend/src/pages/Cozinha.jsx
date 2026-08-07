import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import * as pedidoService from '../services/pedidoService';
import { obterSocket } from '../services/socket';
import { TIPO_LABEL, PAGAMENTO_LABEL } from '../utils/pedidoConstantes';

function tocarBip() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.16);
    });
  } catch (e) { /* navegador sem suporte a audio, ignora */ }
}

function tempoDecorridoMin(dataIso) {
  return Math.floor((Date.now() - new Date(dataIso).getTime()) / 60000);
}

function corPrioridade(min) {
  if (min >= 20) return '#e06666';
  if (min >= 10) return '#e0a020';
  return '#7bc47f';
}

function imprimirComanda(pedido) {
  const itensHtml = pedido.itens.map((i) => {
    const adicionais = i.adicionaisJson ? JSON.parse(i.adicionaisJson) : [];
    return `
      <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #000">
        <div style="font-weight:bold">${i.quantidade}x ${i.nomeProduto}</div>
        ${adicionais.length ? `<div style="font-size:12px">+ ${adicionais.map((a) => a.nome).join(', ')}</div>` : ''}
        ${i.observacoes ? `<div style="font-size:12px;font-style:italic">Obs: ${i.observacoes}</div>` : ''}
      </div>`;
  }).join('');

  const html = `
    <html><head><title>Comanda #${pedido.numero}</title>
    <style>
      body{font-family:monospace;width:280px;margin:0;padding:12px;color:#000}
      h2{margin:0 0 4px;text-align:center}
      .info{font-size:12px;margin-bottom:10px;text-align:center}
    </style></head>
    <body>
      <h2>Pedido #${pedido.numero}</h2>
      <div class="info">${new Date(pedido.criadoEm).toLocaleString('pt-BR')}<br>
      ${pedido.tipo}${pedido.mesa ? ' — Mesa ' + pedido.mesa.numero : ''}<br>
      ${pedido.clienteNome || ''}</div>
      ${itensHtml}
      ${pedido.observacoes ? `<div style="margin-top:8px;font-size:12px"><strong>Obs geral:</strong> ${pedido.observacoes}</div>` : ''}
    </body></html>`;

  const janela = window.open('', '_blank', 'width=320,height=600');
  janela.document.write(html);
  janela.document.close();
  janela.focus();
  janela.print();
}

function CartaoPedido({ pedido, onAvancar, agora }) {
  const min = Math.floor((agora - new Date(pedido.criadoEm).getTime()) / 60000);
  const cor = corPrioridade(min);

  return (
    <div className="card" style={{ borderColor: cor, borderWidth: 2, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 16, color: 'var(--dourado)' }}>#{pedido.numero}</strong>
        <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>⏱ {min} min</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 10 }}>
        {TIPO_LABEL[pedido.tipo]}{pedido.mesa ? ` — Mesa ${pedido.mesa.numero}` : ''}
        {pedido.clienteNome ? ` · ${pedido.clienteNome}` : ''}
      </div>

      {pedido.itens.map((item) => {
        const adicionais = item.adicionaisJson ? JSON.parse(item.adicionaisJson) : [];
        return (
          <div key={item.id} style={{ fontSize: 13, marginBottom: 6 }}>
            <strong>{item.quantidade}x</strong> {item.nomeProduto}
            {!!adicionais.length && <div style={{ fontSize: 11, color: 'var(--texto2)' }}>+ {adicionais.map((a) => a.nome).join(', ')}</div>}
            {item.observacoes && <div style={{ fontSize: 11, color: 'var(--dourado)', fontStyle: 'italic' }}>Obs: {item.observacoes}</div>}
          </div>
        );
      })}

      {pedido.observacoes && <div style={{ fontSize: 11.5, color: 'var(--texto2)', marginTop: 6, fontStyle: 'italic' }}>Geral: {pedido.observacoes}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn" style={{ flex: 1, fontSize: 12.5, padding: '9px' }} onClick={() => onAvancar(pedido)}>
          {pedido.status === 'RECEBIDO' ? 'Iniciar preparo' : 'Marcar pronto'}
        </button>
        <button className="btn-outline" style={{ fontSize: 12.5, padding: '9px 12px', borderRadius: 8 }} onClick={() => imprimirComanda(pedido)}>🖨️</button>
      </div>
    </div>
  );
}

export default function Cozinha() {
  const [recebidos, setRecebidos] = useState([]);
  const [preparando, setPreparando] = useState([]);
  const [agora, setAgora] = useState(Date.now());
  const idsConhecidos = useRef(new Set());
  const primeiraCarga = useRef(true);
  const [impressaoAutomatica, setImpressaoAutomatica] = useState(() => localStorage.getItem('agape_impressao_automatica') === 'true');

  const carregar = useCallback(async () => {
    const [listaRecebidos, listaPreparando] = await Promise.all([
      pedidoService.listarPedidos({ status: 'RECEBIDO' }),
      pedidoService.listarPedidos({ status: 'PREPARANDO' })
    ]);

    const todosIds = [...listaRecebidos, ...listaPreparando].map((p) => p.id);
    if (!primeiraCarga.current) {
      const novos = listaRecebidos.filter((p) => !idsConhecidos.current.has(p.id));
      if (novos.length) tocarBip();
    }
    primeiraCarga.current = false;
    idsConhecidos.current = new Set(todosIds);

    setRecebidos(listaRecebidos);
    setPreparando(listaPreparando);
  }, []);

  useEffect(() => {
    carregar();
    const intervaloDados = setInterval(carregar, 8000);
    const intervaloRelogio = setInterval(() => setAgora(Date.now()), 1000);

    const socket = obterSocket();
    socket?.on('pedido:novo', carregar);
    socket?.on('pedido:atualizado', carregar);

    return () => {
      clearInterval(intervaloDados);
      clearInterval(intervaloRelogio);
      socket?.off('pedido:novo', carregar);
      socket?.off('pedido:atualizado', carregar);
    };
  }, [carregar]);

  useEffect(() => {
    localStorage.setItem('agape_impressao_automatica', String(impressaoAutomatica));
    if (!impressaoAutomatica) return undefined;

    const socket = obterSocket();
    function aoReceberNovo(pedido) { imprimirComanda(pedido); }
    socket?.on('pedido:novo', aoReceberNovo);
    return () => socket?.off('pedido:novo', aoReceberNovo);
  }, [impressaoAutomatica]);

  async function avancar(pedido) {
    const novoStatus = pedido.status === 'RECEBIDO' ? 'PREPARANDO' : 'PRONTO';
    await pedidoService.atualizarStatusPedido(pedido.id, novoStatus);
    carregar();
  }

  return (
    <AdminLayout titulo="Cozinha">
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', fontSize: 13, color: 'var(--texto)', cursor: 'pointer', marginBottom: 16, width: 'fit-content' }}>
        <input type="checkbox" checked={impressaoAutomatica} onChange={(e) => setImpressaoAutomatica(e.target.checked)} style={{ width: 'auto' }} />
        🖨️ Impressão automática de comanda ao chegar novo pedido
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, color: 'var(--dourado)', marginBottom: 12 }}>🔔 Novos pedidos ({recebidos.length})</h3>
          {!recebidos.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum pedido novo.</p>}
          {recebidos.map((p) => <CartaoPedido key={p.id} pedido={p} onAvancar={avancar} agora={agora} />)}
        </div>
        <div>
          <h3 style={{ fontSize: 15, color: 'var(--dourado)', marginBottom: 12 }}>🔥 Em preparo ({preparando.length})</h3>
          {!preparando.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum pedido em preparo.</p>}
          {preparando.map((p) => <CartaoPedido key={p.id} pedido={p} onAvancar={avancar} agora={agora} />)}
        </div>
      </div>
    </AdminLayout>
  );
}
