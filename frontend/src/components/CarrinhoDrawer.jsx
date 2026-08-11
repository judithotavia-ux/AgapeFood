import { useEffect, useState } from 'react';
import ModalPublico from './ModalPublico';

function fmtPreco(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

const campoStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#0a0a0a', color: '#f2ead9', fontSize: 13.5, marginBottom: 10 };
const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: '#b8ac8e', display: 'block', marginBottom: 6 };

export default function CarrinhoDrawer({ aberto, onFechar, itens, onRemover, onAtualizarQtd, mesa, cliente, enderecosSalvos, gorjeta, onFinalizar, enviando, erro, cor }) {
  const [tipo, setTipo] = useState(mesa ? 'MESA' : 'RETIRADA');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [enderecoManual, setEnderecoManual] = useState('');
  const [enderecoSalvoId, setEnderecoSalvoId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [percentualGorjeta, setPercentualGorjeta] = useState(gorjeta?.ativa ? gorjeta.percentualPadrao : 0);

  useEffect(() => {
    if (cliente) { setNome(cliente.nome || ''); setTelefone(cliente.telefone || ''); }
  }, [cliente]);

  useEffect(() => {
    if (mesa) setTipo('MESA');
  }, [mesa]);

  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const valorGorjeta = gorjeta?.ativa ? Math.round(subtotal * (percentualGorjeta / 100) * 100) / 100 : 0;
  const totalComGorjeta = subtotal + valorGorjeta;

  function submeter(e) {
    e.preventDefault();
    const enderecoEscolhido = enderecoSalvoId
      ? enderecosSalvos.find((e) => e.id === enderecoSalvoId)
      : null;
    const clienteEndereco = enderecoEscolhido
      ? `${enderecoEscolhido.endereco}, ${enderecoEscolhido.numero || 's/n'}${enderecoEscolhido.bairro ? ' — ' + enderecoEscolhido.bairro : ''}`
      : enderecoManual;

    onFinalizar({
      tipo,
      itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade, adicionaisIds: i.adicionaisIds, observacoes: i.observacoes })),
      clienteNome: nome,
      clienteTelefone: telefone,
      clienteEndereco: tipo === 'DELIVERY' ? clienteEndereco : undefined,
      mesaNumero: tipo === 'MESA' ? mesa : undefined,
      formaPagamento,
      cupomCodigo: cupomCodigo || undefined,
      observacoes: observacoes || undefined,
      gorjetaPercentual: gorjeta?.ativa ? percentualGorjeta : undefined,
      semGorjeta: gorjeta?.ativa ? percentualGorjeta === 0 : undefined
    });
  }

  return (
    <ModalPublico titulo="Seu pedido" aberto={aberto} onFechar={onFechar} cor={cor}>
      {itens.length === 0 ? (
        <div style={{ color: '#b8ac8e', fontSize: 13.5, textAlign: 'center', padding: '20px 0' }}>Seu carrinho está vazio.</div>
      ) : (
        <form onSubmit={submeter}>
          <div style={{ marginBottom: 16 }}>
            {itens.map((item) => (
              <div key={item.chaveCarrinho} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #2a2a2a' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.nome}</div>
                  {!!item.adicionaisSelecionados?.length && (
                    <div style={{ fontSize: 11, color: '#b8ac8e' }}>{item.adicionaisSelecionados.map((a) => a.nome).join(', ')}</div>
                  )}
                  {item.observacoes && <div style={{ fontSize: 11, color: '#b8ac8e', fontStyle: 'italic' }}>{item.observacoes}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <button type="button" onClick={() => onAtualizarQtd(item.chaveCarrinho, item.quantidade - 1)} style={btnQtdMini(cor)}>−</button>
                    <span style={{ fontSize: 13, minWidth: 16, textAlign: 'center' }}>{item.quantidade}</span>
                    <button type="button" onClick={() => onAtualizarQtd(item.chaveCarrinho, item.quantidade + 1)} style={btnQtdMini(cor)}>+</button>
                    <button type="button" onClick={() => onRemover(item.chaveCarrinho)} style={{ background: 'none', border: 'none', color: '#e06666', fontSize: 11.5, cursor: 'pointer', marginLeft: 6 }}>remover</button>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: cor, whiteSpace: 'nowrap' }}>{fmtPreco(item.precoUnitario * item.quantidade)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: gorjeta?.ativa ? 4 : 18 }}>
            <span style={{ color: gorjeta?.ativa ? '#b8ac8e' : undefined, fontWeight: gorjeta?.ativa ? 400 : 700 }}>Subtotal</span>
            <span style={{ color: gorjeta?.ativa ? '#f2ead9' : cor, fontWeight: gorjeta?.ativa ? 400 : 700 }}>{fmtPreco(subtotal)}</span>
          </div>

          {gorjeta?.ativa && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: '#b8ac8e' }}>Gorjeta</span>
                <span>{fmtPreco(valorGorjeta)}</span>
              </div>
              {gorjeta.permitirClienteEscolher && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {[...gorjeta.opcoesPercentual, 0].map((p) => (
                    <button
                      key={p} type="button" onClick={() => setPercentualGorjeta(p)}
                      style={{
                        padding: '7px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
                        border: `1px solid ${percentualGorjeta === p ? cor : '#333'}`,
                        background: percentualGorjeta === p ? `${cor}22` : 'transparent',
                        color: percentualGorjeta === p ? cor : '#b8ac8e'
                      }}
                    >
                      {p === 0 ? 'Sem gorjeta' : `${p}%`}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, paddingTop: 10, borderTop: '1px solid #2a2a2a' }}>
                <span>Total</span>
                <span style={{ color: cor }}>{fmtPreco(totalComGorjeta)}</span>
              </div>
            </div>
          )}

          {!mesa && (
            <>
              <label style={labelStyle}>Tipo de pedido</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {['RETIRADA', 'DELIVERY'].map((t) => (
                  <button
                    key={t} type="button" onClick={() => setTipo(t)}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1px solid ${tipo === t ? cor : '#333'}`, background: tipo === t ? `${cor}22` : 'transparent', color: tipo === t ? cor : '#b8ac8e', fontSize: 12.5, cursor: 'pointer' }}
                  >
                    {t === 'RETIRADA' ? 'Retirar no local' : 'Entrega'}
                  </button>
                ))}
              </div>
            </>
          )}

          <label style={labelStyle}>Nome</label>
          <input style={campoStyle} value={nome} onChange={(e) => setNome(e.target.value)} required />

          <label style={labelStyle}>Telefone</label>
          <input style={campoStyle} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(92) 99999-9999" required />

          {tipo === 'DELIVERY' && (
            <>
              <label style={labelStyle}>Endereço de entrega</label>
              {cliente && enderecosSalvos?.length > 0 ? (
                <select style={campoStyle} value={enderecoSalvoId} onChange={(e) => setEnderecoSalvoId(e.target.value)}>
                  <option value="">Digitar outro endereço…</option>
                  {enderecosSalvos.map((e) => (
                    <option key={e.id} value={e.id}>{e.apelido} — {e.endereco}, {e.numero}</option>
                  ))}
                </select>
              ) : null}
              {(!enderecoSalvoId) && (
                <input style={campoStyle} value={enderecoManual} onChange={(e) => setEnderecoManual(e.target.value)} placeholder="Rua, número, bairro" required />
              )}
            </>
          )}

          <label style={labelStyle}>Forma de pagamento</label>
          <select style={campoStyle} value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option value="PIX">Pix</option>
            <option value="CARTAO">Cartão</option>
            <option value="DINHEIRO">Dinheiro</option>
          </select>

          <label style={labelStyle}>Cupom (opcional)</label>
          <input style={campoStyle} value={cupomCodigo} onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())} placeholder="CÓDIGO" />

          <label style={labelStyle}>Observações (opcional)</label>
          <input style={campoStyle} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alguma observação geral do pedido?" />

          {erro && <div style={{ color: '#e06666', fontSize: 12.5, marginBottom: 10 }}>{erro}</div>}

          <button type="submit" disabled={enviando} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: cor, color: '#16130a', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            {enviando ? 'Enviando…' : `Finalizar pedido — ${fmtPreco(totalComGorjeta)}`}
          </button>
        </form>
      )}
    </ModalPublico>
  );
}

function btnQtdMini(cor) {
  return { width: 22, height: 22, borderRadius: 6, border: `1px solid ${cor}55`, background: 'transparent', color: cor, fontSize: 13, cursor: 'pointer', lineHeight: 1 };
}
