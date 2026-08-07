import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdicionarItemModal from '../components/AdicionarItemModal';
import * as cardapioService from '../services/cardapioService';
import * as pedidoService from '../services/pedidoService';
import * as mesaService from '../services/mesaService';
import { fmtPreco } from '../utils/pedidoConstantes';

export default function Garcons() {
  const { usuario, sair } = useAuth();
  const [tela, setTela] = useState('mesas'); // mesas | cardapio | carrinho | sucesso

  const [mesas, setMesas] = useState([]);
  const [mesaSelecionada, setMesaSelecionada] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  useEffect(() => {
    async function carregar() {
      const [listaMesas, listaCategorias, listaProdutos] = await Promise.all([
        mesaService.listarMesas(),
        cardapioService.listarCategorias(),
        cardapioService.listarProdutos({})
      ]);
      setMesas(listaMesas);
      setCategorias(listaCategorias);
      setProdutos(listaProdutos.filter((p) => p.disponivel));
      setCategoriaAtiva(listaCategorias[0]?.id || null);
      setCarregando(false);
    }
    carregar();
  }, []);

  function escolherMesa(mesa) {
    setMesaSelecionada(mesa);
    setCarrinho([]);
    setObservacoesGerais('');
    setErro('');
    setTela('cardapio');
  }

  function adicionarAoCarrinho({ produto, quantidade, adicionaisIds, observacoes }) {
    setCarrinho((lista) => [...lista, { chave: Date.now() + Math.random(), produto, quantidade, adicionaisIds, observacoes }]);
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

  const totalCarrinho = carrinho.reduce((soma, item) => soma + calcularPrecoItem(item), 0);
  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

  async function confirmarPedido() {
    setErro('');
    if (!carrinho.length) return setErro('Adicione ao menos um item.');
    setEnviando(true);
    try {
      const pedido = await pedidoService.criarPedido({
        tipo: 'MESA',
        mesaId: mesaSelecionada.id,
        itens: carrinho.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
          adicionaisIds: item.adicionaisIds,
          observacoes: item.observacoes || undefined
        })),
        observacoes: observacoesGerais || undefined
      });
      setPedidoConfirmado(pedido);
      setTela('sucesso');
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível enviar o pedido.');
    } finally {
      setEnviando(false);
    }
  }

  function novoPedidoMesmaMesa() {
    setCarrinho([]);
    setObservacoesGerais('');
    setPedidoConfirmado(null);
    setTela('cardapio');
  }

  function trocarDeMesa() {
    setMesaSelecionada(null);
    setCarrinho([]);
    setObservacoesGerais('');
    setPedidoConfirmado(null);
    setTela('mesas');
  }

  const produtosDaCategoria = produtos.filter((p) => p.categoriaId === categoriaAtiva);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--preto)' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderBottom: '1px solid var(--borda)', position: 'sticky', top: 0, background: 'var(--preto)', zIndex: 10
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dourado)' }}>🍽️ Garçons</div>
          <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{usuario?.nome}{mesaSelecionada ? ` · Mesa ${mesaSelecionada.numero}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/dashboard" className="btn-outline" style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8, textDecoration: 'none' }}>Painel</Link>
          <button className="btn-outline" style={{ fontSize: 12, padding: '7px 12px', borderRadius: 8 }} onClick={sair}>Sair</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: 16, paddingBottom: tela === 'cardapio' && carrinho.length ? 90 : 16 }}>
        {carregando && <p style={{ color: 'var(--texto2)', textAlign: 'center', marginTop: 40 }}>Carregando…</p>}

        {!carregando && tela === 'mesas' && (
          <>
            <h2 style={{ fontSize: 17, marginBottom: 14 }}>Selecione a mesa</h2>
            {!mesas.length && <p style={{ fontSize: 13, color: 'var(--texto2)' }}>Nenhuma mesa cadastrada. Peça para um administrador cadastrar mesas no Salão.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
              {mesas.map((m) => (
                <button
                  key={m.id}
                  className="card"
                  style={{ padding: '20px 8px', textAlign: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
                  onClick={() => escolherMesa(m)}
                >
                  {m.numero}
                </button>
              ))}
            </div>
          </>
        )}

        {!carregando && tela === 'cardapio' && (
          <>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
              {categorias.map((c) => (
                <button
                  key={c.id}
                  className="ans-btn"
                  style={{ flexShrink: 0, ...(categoriaAtiva === c.id ? { background: 'var(--dourado)', color: '#16130a', borderColor: 'var(--dourado)' } : {}) }}
                  onClick={() => setCategoriaAtiva(c.id)}
                >
                  {c.nome}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {produtosDaCategoria.map((p) => (
                <button
                  key={p.id}
                  className="card"
                  style={{ textAlign: 'left', cursor: 'pointer', padding: 12 }}
                  onClick={() => setProdutoSelecionado(p)}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nome}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--dourado)', marginTop: 4 }}>{fmtPreco(p.precoPromocional ?? p.preco)}</div>
                </button>
              ))}
              {!produtosDaCategoria.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum produto nesta categoria.</p>}
            </div>
          </>
        )}

        {tela === 'carrinho' && (
          <>
            <h2 style={{ fontSize: 17, marginBottom: 14 }}>Pedido — Mesa {mesaSelecionada.numero}</h2>
            {!carrinho.length && <p style={{ fontSize: 13, color: 'var(--texto2)' }}>Nenhum item adicionado ainda.</p>}
            {carrinho.map((item) => (
              <div key={item.chave} className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 13 }}>
                  <strong>{item.quantidade}x</strong> {item.produto.nome}
                  {!!item.adicionaisIds.length && (
                    <div style={{ color: 'var(--texto2)', fontSize: 11 }}>
                      + {item.produto.adicionais.filter((a) => item.adicionaisIds.includes(a.id)).map((a) => a.nome).join(', ')}
                    </div>
                  )}
                  {item.observacoes && <div style={{ color: 'var(--texto2)', fontSize: 11, fontStyle: 'italic' }}>{item.observacoes}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtPreco(calcularPrecoItem(item))}</div>
                  <button type="button" onClick={() => removerDoCarrinho(item.chave)} style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 11, cursor: 'pointer', padding: 0 }}>Remover</button>
                </div>
              </div>
            ))}

            <label style={{ marginTop: 10 }}>Observações gerais do pedido</label>
            <input value={observacoesGerais} onChange={(e) => setObservacoesGerais(e.target.value)} placeholder="Opcional" style={{ marginBottom: 16 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              <span>Total</span>
              <span style={{ color: 'var(--dourado)' }}>{fmtPreco(totalCarrinho)}</span>
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            <button type="button" className="btn" style={{ width: '100%', marginBottom: 10 }} onClick={confirmarPedido} disabled={enviando || !carrinho.length}>
              {enviando ? 'Enviando…' : 'Confirmar pedido'}
            </button>
            <button type="button" className="btn-outline" style={{ width: '100%', borderRadius: 10, padding: 10 }} onClick={() => setTela('cardapio')}>
              ← Adicionar mais itens
            </button>
          </>
        )}

        {tela === 'sucesso' && pedidoConfirmado && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>Pedido #{pedidoConfirmado.numero} enviado!</h2>
            <p style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 24 }}>Mesa {mesaSelecionada.numero} · já está na cozinha</p>
            <button type="button" className="btn" style={{ width: '100%', marginBottom: 10 }} onClick={novoPedidoMesmaMesa}>+ Novo pedido nesta mesa</button>
            <button type="button" className="btn-outline" style={{ width: '100%', borderRadius: 10, padding: 10 }} onClick={trocarDeMesa}>Trocar de mesa</button>
          </div>
        )}
      </main>

      {tela === 'cardapio' && !!carrinho.length && (
        <button
          type="button"
          onClick={() => setTela('carrinho')}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px',
            background: 'var(--dourado)', color: '#16130a', border: 'none', fontWeight: 700, fontSize: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
          }}
        >
          <span>🛒 {totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
          <span>Ver pedido · {fmtPreco(totalCarrinho)} →</span>
        </button>
      )}

      <AdicionarItemModal
        produto={produtoSelecionado}
        aberto={!!produtoSelecionado}
        onFechar={() => setProdutoSelecionado(null)}
        onAdicionar={adicionarAoCarrinho}
      />
    </div>
  );
}
