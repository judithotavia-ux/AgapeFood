import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdicionarItemModal from '../components/AdicionarItemModal';
import * as cardapioService from '../services/cardapioService';
import * as pedidoService from '../services/pedidoService';
import * as mesaService from '../services/mesaService';
import * as deliveryService from '../services/deliveryService';
import { fmtPreco, PAGAMENTO_LABEL, CANAL_LABEL } from '../utils/pedidoConstantes';

const TIPOS = [
  { valor: 'BALCAO', label: '🧾 Balcão' },
  { valor: 'RETIRADA', label: '🏃 Retirada' },
  { valor: 'DELIVERY', label: '🚚 Delivery' },
  { valor: 'MESA', label: '🍽️ Mesa' }
];

export default function NovoPedido() {
  const navigate = useNavigate();
  const location = useLocation();
  const mesaPreSelecionada = location.state?.mesaId;

  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [canais, setCanais] = useState([]);
  const [motoboys, setMotoboys] = useState([]);
  const [busca, setBusca] = useState('');

  const [tipo, setTipo] = useState(mesaPreSelecionada ? 'MESA' : 'BALCAO');
  const [mesaId, setMesaId] = useState(mesaPreSelecionada || '');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [taxaEntrega, setTaxaEntrega] = useState('');
  const [canalEntrega, setCanalEntrega] = useState('MOTOBOY_PROPRIO');
  const [motoboyId, setMotoboyId] = useState('');
  const [taxaMotoboy, setTaxaMotoboy] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cardapioService.listarCategorias().then(setCategorias);
    cardapioService.listarProdutos({ }).then((lista) => setProdutos(lista.filter((p) => p.disponivel)));
    mesaService.listarMesas().then(setMesas);
    deliveryService.listarCanaisEntrega().then((lista) => setCanais(lista.filter((c) => c.ativo)));
    deliveryService.listarMotoboys().then((lista) => setMotoboys(lista.filter((m) => m.ativo)));
  }, []);

  const termo = busca.trim().toLowerCase();
  const produtosFiltrados = termo
    ? produtos.filter((p) => p.nome.toLowerCase().includes(termo) || (p.codigoBarras && p.codigoBarras.toLowerCase().includes(termo)))
    : produtos;

  function adicionarAoCarrinho({ produto, quantidade, adicionaisIds, observacoes: obsItem }) {
    setCarrinho((lista) => [...lista, { chave: Date.now() + Math.random(), produto, quantidade, adicionaisIds, observacoes: obsItem }]);
  }

  // Leitor de codigo de barras USB "digita" os numeros e manda Enter, igual um teclado - nao
  // precisa de campo separado, so aproveita a mesma busca. Se o produto nao tem adicionais, entra
  // direto no carrinho (fluxo rapido de "passar e pronto"); se tem, abre o modal pra escolher.
  function aoTeclarBusca(e) {
    if (e.key !== 'Enter') return;
    const codigo = busca.trim();
    if (!codigo) return;
    const produto = produtos.find((p) => p.codigoBarras && p.codigoBarras === codigo);
    if (!produto) return;
    if (produto.adicionais?.length) {
      setProdutoSelecionado(produto);
    } else {
      adicionarAoCarrinho({ produto, quantidade: 1, adicionaisIds: [], observacoes: '' });
    }
    setBusca('');
  }

  function removerDoCarrinho(chave) {
    setCarrinho((lista) => lista.filter((i) => i.chave !== chave));
  }

  function calcularPrecoItem(item) {
    const precoBase = Number(item.produto.precoPromocional ?? item.produto.preco);
    const precoAdicionais = (item.produto.adicionais || [])
      .filter((a) => item.adicionaisIds.includes(a.id))
      .reduce((soma, a) => soma + Number(a.preco), 0);
    return (precoBase + precoAdicionais) * item.quantidade;
  }

  const subtotal = carrinho.reduce((soma, item) => soma + calcularPrecoItem(item), 0);
  const taxa = Number(taxaEntrega) || 0;
  const total = subtotal + (tipo === 'DELIVERY' ? taxa : 0);

  async function finalizarPedido() {
    setErro('');
    if (!carrinho.length) return setErro('Adicione ao menos um item ao pedido.');
    if (tipo === 'DELIVERY' && !clienteEndereco.trim()) return setErro('Informe o endereço de entrega.');
    if (tipo === 'MESA' && !mesaId) return setErro('Selecione a mesa.');

    const itens = carrinho.map((item) => ({
      produtoId: item.produto.id,
      quantidade: item.quantidade,
      adicionaisIds: item.adicionaisIds,
      observacoes: item.observacoes || undefined
    }));

    setEnviando(true);
    try {
      const pedido = await pedidoService.criarPedido({
        tipo,
        itens,
        clienteNome: clienteNome || undefined,
        clienteTelefone: clienteTelefone || undefined,
        clienteEndereco: tipo === 'DELIVERY' ? clienteEndereco : undefined,
        formaPagamento,
        taxaEntrega: tipo === 'DELIVERY' ? taxa : 0,
        observacoes: observacoes || undefined,
        mesaId: tipo === 'MESA' ? mesaId : undefined,
        canalEntrega: tipo === 'DELIVERY' ? canalEntrega : undefined,
        motoboyId: tipo === 'DELIVERY' && canalEntrega === 'MOTOBOY_PROPRIO' && motoboyId ? motoboyId : undefined,
        taxaMotoboy: tipo === 'DELIVERY' && canalEntrega === 'MOTOBOY_PROPRIO' && taxaMotoboy !== '' ? Number(taxaMotoboy) : undefined
      });
      if (tipo === 'MESA') navigate('/salao', { state: { pedidoCriado: pedido.numero } });
      else navigate('/pedidos', { state: { pedidoCriado: pedido.numero } });
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível criar o pedido.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AdminLayout titulo="Novo pedido">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 420px', minWidth: 320 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  className="ans-btn"
                  onClick={() => setTipo(t.valor)}
                  style={tipo === t.valor ? { background: 'var(--dourado)', color: '#16130a', borderColor: 'var(--dourado)' } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label>Nome do cliente</label>
                <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Opcional" />
              </div>
              <div>
                <label>Telefone</label>
                <input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            {tipo === 'DELIVERY' && (
              <>
                <div style={{ marginTop: 12 }}>
                  <label>Endereço de entrega</label>
                  <input value={clienteEndereco} onChange={(e) => setClienteEndereco(e.target.value)} placeholder="Rua, número, bairro..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: canalEntrega === 'MOTOBOY_PROPRIO' ? '1fr 1fr 1fr' : '1fr', gap: 12, marginTop: 12 }}>
                  <div>
                    <label>Canal de entrega</label>
                    <select value={canalEntrega} onChange={(e) => setCanalEntrega(e.target.value)}>
                      {canais.map((c) => <option key={c.id} value={c.tipo}>{CANAL_LABEL[c.tipo]}</option>)}
                    </select>
                  </div>
                  {canalEntrega === 'MOTOBOY_PROPRIO' && (
                    <>
                      <div>
                        <label>Motoboy</label>
                        <select value={motoboyId} onChange={(e) => setMotoboyId(e.target.value)}>
                          <option value="">Sem motoboy definido</option>
                          {motoboys.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label>Valor do motoboy (R$)</label>
                        <input type="number" step="0.01" min="0" value={taxaMotoboy} onChange={(e) => setTaxaMotoboy(e.target.value)} placeholder="Ex: 8.00" />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {tipo === 'MESA' && (
              <div style={{ marginTop: 12 }}>
                <label>Mesa</label>
                <select value={mesaId} onChange={(e) => setMesaId(e.target.value)}>
                  <option value="">Selecione a mesa</option>
                  {mesas.map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
                </select>
                {!mesas.length && <p style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 6 }}>Nenhuma mesa cadastrada ainda.</p>}
              </div>
            )}
          </div>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={aoTeclarBusca}
            placeholder="🔍 Buscar produto ou passar leitor de código de barras…"
            style={{ marginBottom: 14 }}
            autoFocus
          />

          {categorias.map((cat) => {
            const produtosCategoria = produtosFiltrados.filter((p) => p.categoriaId === cat.id);
            if (!produtosCategoria.length) return null;
            return (
              <div key={cat.id} style={{ marginBottom: 18 }}>
                <h4 style={{ fontSize: 14, color: 'var(--dourado)', marginBottom: 10 }}>{cat.nome}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {produtosCategoria.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProdutoSelecionado(p)}
                      className="card"
                      style={{ textAlign: 'left', cursor: 'pointer', padding: 12, border: '1px solid var(--borda)' }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nome}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--dourado)', marginTop: 4 }}>{fmtPreco(p.precoPromocional ?? p.preco)}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 280, position: 'sticky', top: 20 }}>
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>🛒 Itens do pedido</h3>

            {!carrinho.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Clique em um produto ao lado para adicionar.</p>}

            {carrinho.map((item) => (
              <div key={item.chave} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--borda)' }}>
                <div style={{ fontSize: 12.5 }}>
                  <strong>{item.quantidade}x</strong> {item.produto.nome}
                  {!!item.adicionaisIds.length && (
                    <div style={{ color: 'var(--texto2)', fontSize: 11 }}>
                      + {item.produto.adicionais.filter((a) => item.adicionaisIds.includes(a.id)).map((a) => a.nome).join(', ')}
                    </div>
                  )}
                  {item.observacoes && <div style={{ color: 'var(--texto2)', fontSize: 11, fontStyle: 'italic' }}>{item.observacoes}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{fmtPreco(calcularPrecoItem(item))}</div>
                  <button type="button" onClick={() => removerDoCarrinho(item.chave)} style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 11, cursor: 'pointer', padding: 0 }}>Remover</button>
                </div>
              </div>
            ))}

            {tipo === 'DELIVERY' && (
              <div style={{ marginTop: 14 }}>
                <label>Taxa de entrega (R$)</label>
                <input type="number" step="0.01" min="0" value={taxaEntrega} onChange={(e) => setTaxaEntrega(e.target.value)} placeholder="0.00" />
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <label>Forma de pagamento</label>
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                {Object.entries(PAGAMENTO_LABEL).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 14 }}>
              <label>Observações gerais</label>
              <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Opcional" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--borda)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--dourado)' }}>{fmtPreco(total)}</span>
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            <button type="button" className="btn" style={{ width: '100%', marginTop: 16 }} onClick={finalizarPedido} disabled={enviando}>
              {enviando ? 'Enviando…' : 'Finalizar pedido'}
            </button>
          </div>
        </div>
      </div>

      <AdicionarItemModal
        produto={produtoSelecionado}
        aberto={!!produtoSelecionado}
        onFechar={() => setProdutoSelecionado(null)}
        onAdicionar={adicionarAoCarrinho}
      />
    </AdminLayout>
  );
}
