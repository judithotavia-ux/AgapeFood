import { useEffect, useState } from 'react';
import Modal from './Modal';

export default function CategoriaFormModal({ aberto, categoria, onFechar, onSalvar }) {
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setNome(categoria?.nome || '');
    setErro('');
  }, [categoria, aberto]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Informe o nome da categoria.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({ nome });
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível salvar a categoria.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={categoria ? 'Editar categoria' : 'Nova categoria'} aberto={aberto} onFechar={onFechar} largura={380}>
      <form onSubmit={handleSubmit}>
        <label>Nome da categoria</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Lanches, Bebidas, Sobremesas" autoFocus />
        {erro && <div className="erro-msg">{erro}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn-outline" style={{ flex: 1, borderRadius: 10, padding: '10px' }} onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn" style={{ flex: 1 }} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  );
}
