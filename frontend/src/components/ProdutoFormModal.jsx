import { useEffect, useState } from 'react';
import Modal from './Modal';
import * as cardapioService from '../services/cardapioService';

const CAMPOS_INICIAIS = {
  nome: '', descricao: '', preco: '', precoPromocional: '', categoriaId: '',
  ingredientes: '', alergenos: '', disponivel: true, destaque: false
};

export default function ProdutoFormModal({ aberto, produto, categorias, onFechar, onSalvar }) {
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [imagemArquivo, setImagemArquivo] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [removerImagem, setRemoverImagem] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [adicionais, setAdicionais] = useState([]);
  const [novoAdNome, setNovoAdNome] = useState('');
  const [novoAdPreco, setNovoAdPreco] = useState('');

  useEffect(() => {
    if (produto) {
      setCampos({
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        preco: produto.preco ?? '',
        precoPromocional: produto.precoPromocional ?? '',
        categoriaId: produto.categoriaId || '',
        ingredientes: produto.ingredientes || '',
        alergenos: produto.alergenos || '',
        disponivel: produto.disponivel ?? true,
        destaque: produto.destaque ?? false
      });
      setImagemPreview(produto.imagemUrl || null);
      setAdicionais(produto.adicionais || []);
    } else {
      setCampos({ ...CAMPOS_INICIAIS, categoriaId: categorias[0]?.id || '' });
      setImagemPreview(null);
      setAdicionais([]);
    }
    setImagemArquivo(null);
    setRemoverImagem(false);
    setErro('');
  }, [produto, aberto, categorias]);

  function handleArquivo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setImagemArquivo(arquivo);
    setImagemPreview(URL.createObjectURL(arquivo));
    setRemoverImagem(false);
  }

  function handleRemoverImagem() {
    setImagemArquivo(null);
    setImagemPreview(null);
    setRemoverImagem(true);
  }

  function set(campo, valor) {
    setCampos((c) => ({ ...c, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!campos.nome.trim()) return setErro('Informe o nome do produto.');
    if (!campos.preco || isNaN(Number(campos.preco))) return setErro('Informe um preço válido.');
    if (!campos.categoriaId) return setErro('Selecione uma categoria.');

    const formData = new FormData();
    Object.entries(campos).forEach(([chave, valor]) => formData.append(chave, valor));
    if (imagemArquivo) formData.append('imagem', imagemArquivo);
    if (removerImagem) formData.append('removerImagem', 'true');

    setSalvando(true);
    setErro('');
    try {
      await onSalvar(formData);
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível salvar o produto.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleAdicionarAdicional() {
    if (!novoAdNome.trim() || !novoAdPreco) return;
    try {
      const criado = await cardapioService.adicionarAdicional(produto.id, { nome: novoAdNome, preco: Number(novoAdPreco) });
      setAdicionais((lista) => [...lista, criado]);
      setNovoAdNome('');
      setNovoAdPreco('');
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível adicionar o item.');
    }
  }

  async function handleRemoverAdicional(adicionalId) {
    await cardapioService.removerAdicional(produto.id, adicionalId);
    setAdicionais((lista) => lista.filter((a) => a.id !== adicionalId));
  }

  return (
    <Modal titulo={produto ? 'Editar produto' : 'Novo produto'} aberto={aberto} onFechar={onFechar} largura={560}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 96, height: 96, borderRadius: 10, background: 'var(--preto3)',
              border: '1px dashed var(--borda)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative'
            }}>
              {imagemPreview
                ? <img src={imagemPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 26 }}>🍽️</span>}
            </div>
            <label className="btn-outline" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 11, padding: '6px 4px', cursor: 'pointer', borderRadius: 8 }}>
              Escolher foto
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleArquivo} style={{ display: 'none' }} />
            </label>
            {imagemPreview && (
              <button type="button" onClick={handleRemoverImagem} style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 11, marginTop: 4, cursor: 'pointer', width: '100%' }}>
                Remover foto
              </button>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label>Nome do produto</label>
            <input value={campos.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: X-Bacon Artesanal" autoFocus />
          </div>
        </div>

        <label>Descrição</label>
        <textarea rows={2} value={campos.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Pão brioche, hambúrguer 180g, bacon, queijo..." style={{ marginBottom: 14 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label>Preço (R$)</label>
            <input type="number" step="0.01" min="0" value={campos.preco} onChange={(e) => set('preco', e.target.value)} placeholder="29.90" />
          </div>
          <div>
            <label>Preço promocional</label>
            <input type="number" step="0.01" min="0" value={campos.precoPromocional} onChange={(e) => set('precoPromocional', e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <label>Categoria</label>
            <select value={campos.categoriaId} onChange={(e) => set('categoriaId', e.target.value)}>
              <option value="">Selecione</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label>Ingredientes</label>
            <input value={campos.ingredientes} onChange={(e) => set('ingredientes', e.target.value)} placeholder="Separe por vírgula" />
          </div>
          <div>
            <label>Alérgenos</label>
            <input value={campos.alergenos} onChange={(e) => set('alergenos', e.target.value)} placeholder="Ex: glúten, lactose, amendoim" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', fontSize: 13, color: 'var(--texto)', cursor: 'pointer' }}>
            <input type="checkbox" checked={campos.disponivel} onChange={(e) => set('disponivel', e.target.checked)} style={{ width: 'auto' }} /> Disponível
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', fontSize: 13, color: 'var(--texto)', cursor: 'pointer' }}>
            <input type="checkbox" checked={campos.destaque} onChange={(e) => set('destaque', e.target.checked)} style={{ width: 'auto' }} /> Produto em destaque
          </label>
        </div>

        {produto?.id && (
          <div style={{ borderTop: '1px solid var(--borda)', paddingTop: 14, marginBottom: 14 }}>
            <label style={{ marginBottom: 8 }}>Adicionais (ex: bacon extra, borda recheada)</label>
            {adicionais.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0' }}>
                <span>{a.nome} — R$ {Number(a.preco).toFixed(2)}</span>
                <button type="button" onClick={() => handleRemoverAdicional(a.id)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer' }}>Remover</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input value={novoAdNome} onChange={(e) => setNovoAdNome(e.target.value)} placeholder="Nome do adicional" style={{ flex: 2 }} />
              <input type="number" step="0.01" min="0" value={novoAdPreco} onChange={(e) => setNovoAdPreco(e.target.value)} placeholder="Preço" style={{ flex: 1 }} />
              <button type="button" className="btn-outline" style={{ borderRadius: 8, padding: '0 14px' }} onClick={handleAdicionarAdicional}>+ Add</button>
            </div>
          </div>
        )}

        {erro && <div className="erro-msg">{erro}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="button" className="btn-outline" style={{ flex: 1, borderRadius: 10, padding: '10px' }} onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn" style={{ flex: 1 }} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar produto'}</button>
        </div>
      </form>
    </Modal>
  );
}
