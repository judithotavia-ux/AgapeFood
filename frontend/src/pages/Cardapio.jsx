import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import CategoriaFormModal from '../components/CategoriaFormModal';
import ProdutoFormModal from '../components/ProdutoFormModal';
import QrCodeCardapio from '../components/QrCodeCardapio';
import * as cardapioService from '../services/cardapioService';
import { useAuth } from '../context/AuthContext';

function fmtPreco(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

export default function Cardapio() {
  const { usuario } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalCategoria, setModalCategoria] = useState({ aberto: false, categoria: null });
  const [modalProduto, setModalProduto] = useState({ aberto: false, produto: null, categoriaId: null });
  const [confirmExcluir, setConfirmExcluir] = useState(null); // { tipo, id, nome }

  async function carregar() {
    setCarregando(true);
    const [cats, prods] = await Promise.all([cardapioService.listarCategorias(), cardapioService.listarProdutos()]);
    setCategorias(cats);
    setProdutos(prods);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  const termo = busca.trim().toLowerCase();
  const produtosFiltrados = termo ? produtos.filter((p) => p.nome.toLowerCase().includes(termo)) : produtos;

  async function handleSalvarCategoria(dados) {
    if (modalCategoria.categoria) {
      await cardapioService.atualizarCategoria(modalCategoria.categoria.id, dados);
    } else {
      await cardapioService.criarCategoria(dados);
    }
    setModalCategoria({ aberto: false, categoria: null });
    await carregar();
  }

  async function handleSalvarProduto(formData) {
    await cardapioService.salvarProduto(modalProduto.produto?.id, formData);
    setModalProduto({ aberto: false, produto: null, categoriaId: null });
    await carregar();
  }

  async function confirmarExclusao() {
    if (!confirmExcluir) return;
    if (confirmExcluir.tipo === 'categoria') await cardapioService.excluirCategoria(confirmExcluir.id);
    else await cardapioService.excluirProduto(confirmExcluir.id);
    setConfirmExcluir(null);
    await carregar();
  }

  return (
    <AdminLayout titulo="Cardápio">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔍 Buscar produto pelo nome…"
          style={{ maxWidth: 300 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={() => setModalCategoria({ aberto: true, categoria: null })}>+ Categoria</button>
          <button className="btn" onClick={() => setModalProduto({ aberto: true, produto: null, categoriaId: categorias[0]?.id })} disabled={!categorias.length}>+ Produto</button>
        </div>
      </div>

      {usuario?.empresa?.slug && (
        <div style={{ marginBottom: 20 }}>
          <QrCodeCardapio slug={usuario.empresa.slug} />
        </div>
      )}

      {carregando && <p style={{ color: 'var(--texto2)' }}>Carregando cardápio…</p>}

      {!carregando && !categorias.length && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)' }}>
          Nenhuma categoria criada ainda. Comece clicando em <strong>+ Categoria</strong>.
        </div>
      )}

      {!carregando && categorias.map((cat) => {
        const produtosDaCategoria = produtosFiltrados.filter((p) => p.categoriaId === cat.id);
        if (termo && !produtosDaCategoria.length) return null;

        return (
          <div key={cat.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16 }}>{cat.nome} <span style={{ color: 'var(--texto2)', fontSize: 12, fontWeight: 400 }}>({produtosDaCategoria.length})</span></h3>
              <div style={{ display: 'flex', gap: 14 }}>
                <button className="btn-outline" style={{ padding: '5px 12px', fontSize: 12, borderRadius: 8 }} onClick={() => setModalProduto({ aberto: true, produto: null, categoriaId: cat.id })}>+ Produto</button>
                <button onClick={() => setModalCategoria({ aberto: true, categoria: cat })} style={{ background: 'none', border: 'none', color: 'var(--texto2)', cursor: 'pointer', fontSize: 13 }}>Editar</button>
                <button onClick={() => setConfirmExcluir({ tipo: 'categoria', id: cat.id, nome: cat.nome })} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 13 }}>Excluir</button>
              </div>
            </div>

            {!produtosDaCategoria.length && <p style={{ color: 'var(--texto2)', fontSize: 13 }}>Nenhum produto nesta categoria.</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
              {produtosDaCategoria.map((p) => (
                <div key={p.id} style={{ border: '1px solid var(--borda)', borderRadius: 10, padding: 12, display: 'flex', gap: 10, opacity: p.disponivel ? 1 : 0.5 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 8, background: 'var(--preto3)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.imagemUrl ? <img src={p.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🍽️</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.destaque && '⭐ '}{p.nome}
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 2 }}>
                      {p.precoPromocional
                        ? <>
                            <span style={{ textDecoration: 'line-through', color: 'var(--texto2)', marginRight: 6 }}>{fmtPreco(p.preco)}</span>
                            <span style={{ color: 'var(--dourado)' }}>{fmtPreco(p.precoPromocional)}</span>
                          </>
                        : <span style={{ color: 'var(--dourado)' }}>{fmtPreco(p.preco)}</span>}
                    </div>
                    {!p.disponivel && <div style={{ fontSize: 10.5, color: 'var(--erro)', marginTop: 2 }}>Indisponível</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                      <button onClick={() => setModalProduto({ aberto: true, produto: p, categoriaId: p.categoriaId })} style={{ background: 'none', border: 'none', color: 'var(--dourado)', cursor: 'pointer', fontSize: 11, padding: 0 }}>Editar</button>
                      <button onClick={() => setConfirmExcluir({ tipo: 'produto', id: p.id, nome: p.nome })} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 11, padding: 0 }}>Excluir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <CategoriaFormModal
        aberto={modalCategoria.aberto}
        categoria={modalCategoria.categoria}
        onFechar={() => setModalCategoria({ aberto: false, categoria: null })}
        onSalvar={handleSalvarCategoria}
      />

      <ProdutoFormModal
        aberto={modalProduto.aberto}
        produto={modalProduto.produto || (modalProduto.categoriaId ? { categoriaId: modalProduto.categoriaId } : null)}
        categorias={categorias}
        onFechar={() => setModalProduto({ aberto: false, produto: null, categoriaId: null })}
        onSalvar={handleSalvarProduto}
      />

      <Modal titulo="Confirmar exclusão" aberto={!!confirmExcluir} onFechar={() => setConfirmExcluir(null)} largura={360}>
        <p style={{ fontSize: 14, color: 'var(--texto2)', marginBottom: 20 }}>
          Tem certeza que deseja excluir <strong style={{ color: 'var(--texto)' }}>{confirmExcluir?.nome}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ flex: 1, borderRadius: 10, padding: '10px' }} onClick={() => setConfirmExcluir(null)}>Cancelar</button>
          <button className="btn" style={{ flex: 1, background: 'var(--erro)', borderColor: 'var(--erro)', color: '#fff' }} onClick={confirmarExclusao}>Excluir</button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
