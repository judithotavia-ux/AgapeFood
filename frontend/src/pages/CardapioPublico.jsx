import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as cardapioService from '../services/cardapioService';
import * as clienteAuthService from '../services/clienteAuthService';
import * as clientePortalService from '../services/clientePortalService';
import AdicionarAoCarrinhoModal from '../components/AdicionarAoCarrinhoModal';
import CarrinhoDrawer from '../components/CarrinhoDrawer';
import ClienteAuthModal from '../components/ClienteAuthModal';
import MinhaContaModal from '../components/MinhaContaModal';

function fmtPreco(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

function chaveCarrinho(slug) {
  return `agapefood_carrinho_${slug}`;
}

export default function CardapioPublico() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa');

  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [erroPedido, setErroPedido] = useState('');
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  const [authAberto, setAuthAberto] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [enderecosSalvos, setEnderecosSalvos] = useState([]);

  useEffect(() => {
    cardapioService.buscarCardapioPublico(slug)
      .then(setDados)
      .catch(() => setErro('Não encontramos esse cardápio. Confira o link e tente novamente.'))
      .finally(() => setCarregando(false));

    const salvo = localStorage.getItem(chaveCarrinho(slug));
    if (salvo) { try { setCarrinho(JSON.parse(salvo)); } catch { /* ignora carrinho corrompido */ } }
  }, [slug]);

  useEffect(() => {
    localStorage.setItem(chaveCarrinho(slug), JSON.stringify(carrinho));
  }, [carrinho, slug]);

  useEffect(() => {
    if (clienteAuthService.estaAutenticadoCliente()) carregarDadosCliente();
  }, []);

  async function carregarDadosCliente() {
    try {
      const [perfil, favoritos, enderecos] = await Promise.all([
        clientePortalService.meuPerfil(),
        clientePortalService.listarFavoritos(),
        clientePortalService.listarEnderecos()
      ]);
      setCliente(perfil);
      setFavoritosIds(favoritos.map((p) => p.id));
      setEnderecosSalvos(enderecos);
    } catch {
      clienteAuthService.logoutCliente();
    }
  }

  function adicionarAoCarrinho(item) {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.chaveCarrinho === item.chaveCarrinho);
      if (existente) {
        return atual.map((i) => i.chaveCarrinho === item.chaveCarrinho ? { ...i, quantidade: i.quantidade + item.quantidade } : i);
      }
      return [...atual, item];
    });
  }

  function atualizarQtdCarrinho(chave, novaQtd) {
    if (novaQtd < 1) return removerDoCarrinho(chave);
    setCarrinho((atual) => atual.map((i) => i.chaveCarrinho === chave ? { ...i, quantidade: novaQtd } : i));
  }

  function removerDoCarrinho(chave) {
    setCarrinho((atual) => atual.filter((i) => i.chaveCarrinho !== chave));
  }

  async function finalizarPedido(dadosPedido) {
    setEnviandoPedido(true);
    setErroPedido('');
    try {
      const resultado = await cardapioService.criarPedidoPublico(slug, dadosPedido);
      setPedidoConfirmado(resultado);
      setCarrinho([]);
      localStorage.removeItem(chaveCarrinho(slug));
      setCarrinhoAberto(false);
    } catch (err) {
      setErroPedido(err.response?.data?.erro || 'Não foi possível enviar seu pedido agora. Tente novamente.');
    } finally {
      setEnviandoPedido(false);
    }
  }

  async function alternarFavorito(produtoId) {
    if (!cliente) { setAuthAberto(true); return; }
    if (favoritosIds.includes(produtoId)) {
      await clientePortalService.removerFavorito(produtoId);
      setFavoritosIds((ids) => ids.filter((id) => id !== produtoId));
    } else {
      await clientePortalService.adicionarFavorito(produtoId);
      setFavoritosIds((ids) => [...ids, produtoId]);
    }
  }

  function aoAutenticar(clienteAutenticado) {
    setCliente(clienteAutenticado);
    carregarDadosCliente();
  }

  function aoSair() {
    setCliente(null);
    setFavoritosIds([]);
    setEnderecosSalvos([]);
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Carregando cardápio…
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f2ead9', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
        {erro}
      </div>
    );
  }

  const cor = dados.empresa.corPrimaria || '#D4AF37';
  const totalItensCarrinho = carrinho.reduce((s, i) => s + i.quantidade, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f2ead9', fontFamily: "'Segoe UI', Arial, sans-serif", paddingBottom: totalItensCarrinho ? 90 : 0 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 18px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
          {cliente ? (
            <button onClick={() => setContaAberta(true)} style={linkTopo(cor)}>👤 {cliente.nome?.split(' ')[0] || 'Minha conta'}</button>
          ) : (
            <button onClick={() => setAuthAberto(true)} style={linkTopo(cor)}>Entrar</button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {dados.empresa.logoUrl && (
            <img src={dados.empresa.logoUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }} />
          )}
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: cor, margin: 0 }}>{dados.empresa.nome}</h1>
          {dados.empresa.slogan && <div style={{ fontSize: 13, color: '#b8ac8e', marginTop: 4, fontStyle: 'italic' }}>{dados.empresa.slogan}</div>}
          <div style={{ fontSize: 12, color: '#b8ac8e', marginTop: 4 }}>Cardápio digital</div>
          {mesa && (
            <div style={{ display: 'inline-block', marginTop: 10, padding: '4px 14px', borderRadius: 20, border: `1px solid ${cor}`, color: cor, fontSize: 12, fontWeight: 600 }}>
              🍽️ Você está na Mesa {mesa}
            </div>
          )}
        </div>

        {!dados.categorias.length && (
          <p style={{ textAlign: 'center', color: '#b8ac8e' }}>Nenhum produto disponível no momento.</p>
        )}

        {dados.categorias.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 16, color: cor, borderBottom: `1px solid ${cor}44`, paddingBottom: 8, marginBottom: 12 }}>{cat.nome}</h2>
            {cat.produtos.map((p) => (
              <div key={p.id} onClick={() => setProdutoSelecionado(p)} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer' }}>
                <div style={{ width: 66, height: 66, borderRadius: 10, background: '#151515', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {p.imagemUrl ? <img src={p.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🍽️</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.destaque && '⭐ '}{p.nome}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); alternarFavorito(p.id); }}
                      style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: favoritosIds.includes(p.id) ? '#e06666' : '#4a4a4a', flexShrink: 0 }}
                    >
                      ♥
                    </button>
                  </div>
                  {p.descricao && <div style={{ fontSize: 12, color: '#b8ac8e', marginTop: 3, lineHeight: 1.5 }}>{p.descricao}</div>}
                  {p.alergenos && <div style={{ fontSize: 10.5, color: '#e0a020', marginTop: 4 }}>⚠ Contém: {p.alergenos}</div>}
                  {!!p.adicionais?.length && (
                    <div style={{ fontSize: 10.5, color: '#b8ac8e', marginTop: 4 }}>
                      + Adicionais: {p.adicionais.map((a) => `${a.nome} (${fmtPreco(a.preco)})`).join(', ')}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>
                    {p.precoPromocional
                      ? <>
                          <span style={{ textDecoration: 'line-through', color: '#8a8272', marginRight: 8, fontWeight: 400, fontSize: 12 }}>{fmtPreco(p.preco)}</span>
                          <span style={{ color: cor }}>{fmtPreco(p.precoPromocional)}</span>
                        </>
                      : <span style={{ color: cor }}>{fmtPreco(p.preco)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {(dados.empresa.instagram || dados.empresa.facebook || dados.empresa.tiktok || dados.empresa.youtube || dados.empresa.whatsapp) && (
          <div style={{ textAlign: 'center', marginTop: 26, display: 'flex', justifyContent: 'center', gap: 16, fontSize: 13 }}>
            {dados.empresa.whatsapp && <a href={`https://wa.me/55${dados.empresa.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: cor }}>WhatsApp</a>}
            {dados.empresa.instagram && <a href={dados.empresa.instagram} target="_blank" rel="noreferrer" style={{ color: cor }}>Instagram</a>}
            {dados.empresa.facebook && <a href={dados.empresa.facebook} target="_blank" rel="noreferrer" style={{ color: cor }}>Facebook</a>}
            {dados.empresa.tiktok && <a href={dados.empresa.tiktok} target="_blank" rel="noreferrer" style={{ color: cor }}>TikTok</a>}
            {dados.empresa.youtube && <a href={dados.empresa.youtube} target="_blank" rel="noreferrer" style={{ color: cor }}>YouTube</a>}
          </div>
        )}

        {dados.empresa.exibirMarcaAgapeFood !== false && (
          <div style={{ textAlign: 'center', fontSize: 11, color: '#5f5946', marginTop: 18 }}>
            Cardápio powered by AgapeFood
          </div>
        )}
      </div>

      {totalItensCarrinho > 0 && !carrinhoAberto && (
        <button
          onClick={() => setCarrinhoAberto(true)}
          style={{
            position: 'fixed', bottom: 18, left: 18, right: 18, maxWidth: 604, margin: '0 auto',
            padding: '15px 20px', borderRadius: 12, border: 'none', background: cor, color: '#16130a',
            fontWeight: 700, fontSize: 14.5, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 500
          }}
        >
          <span>🛒 Ver carrinho ({totalItensCarrinho})</span>
          <span>{fmtPreco(carrinho.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0))}</span>
        </button>
      )}

      <AdicionarAoCarrinhoModal
        produto={produtoSelecionado}
        aberto={!!produtoSelecionado}
        onFechar={() => setProdutoSelecionado(null)}
        onAdicionar={adicionarAoCarrinho}
        cor={cor}
      />

      <CarrinhoDrawer
        aberto={carrinhoAberto}
        onFechar={() => setCarrinhoAberto(false)}
        itens={carrinho}
        onRemover={removerDoCarrinho}
        onAtualizarQtd={atualizarQtdCarrinho}
        mesa={mesa}
        cliente={cliente}
        enderecosSalvos={enderecosSalvos}
        onFinalizar={finalizarPedido}
        gorjeta={dados.gorjeta}
        enviando={enviandoPedido}
        erro={erroPedido}
        cor={cor}
      />

      <ClienteAuthModal
        aberto={authAberto}
        onFechar={() => setAuthAberto(false)}
        onAutenticado={aoAutenticar}
        slugEmpresa={slug}
        cor={cor}
      />

      <MinhaContaModal
        aberto={contaAberta}
        onFechar={() => setContaAberta(false)}
        cliente={cliente}
        onSair={aoSair}
        cor={cor}
      />

      {pedidoConfirmado && (
        <div onClick={() => setPedidoConfirmado(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#151515', border: `1px solid ${cor}44`, borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 360 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: 'Georgia, serif', color: cor, fontSize: 22, marginBottom: 8, fontWeight: 400 }}>Pedido enviado!</h2>
            <p style={{ fontSize: 13.5, color: '#b8ac8e', marginBottom: pedidoConfirmado.gorjetaValor > 0 ? 8 : 22 }}>Seu pedido #{pedidoConfirmado.numero} foi recebido e já está sendo preparado.</p>
            {pedidoConfirmado.gorjetaValor > 0 && (
              <p style={{ fontSize: 12, color: '#b8ac8e', marginBottom: 22 }}>
                Consumo {fmtPreco(pedidoConfirmado.valorTotal)} + gorjeta {fmtPreco(pedidoConfirmado.gorjetaValor)} = <strong style={{ color: cor }}>{fmtPreco(pedidoConfirmado.totalComGorjeta)}</strong>
              </p>
            )}
            <button onClick={() => setPedidoConfirmado(null)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: cor, color: '#16130a', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function linkTopo(cor) {
  return { background: 'none', border: 'none', color: cor, fontSize: 12.5, cursor: 'pointer', padding: '8px 4px', fontWeight: 600 };
}
