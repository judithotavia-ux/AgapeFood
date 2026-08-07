import { useEffect, useState } from 'react';
import Modal from './Modal';
import { fmtPreco } from '../utils/pedidoConstantes';

export default function AdicionarItemModal({ produto, aberto, onFechar, onAdicionar }) {
  const [quantidade, setQuantidade] = useState(1);
  const [adicionaisIds, setAdicionaisIds] = useState([]);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    setQuantidade(1);
    setAdicionaisIds([]);
    setObservacoes('');
  }, [produto, aberto]);

  if (!produto) return null;

  const precoBase = Number(produto.precoPromocional ?? produto.preco);
  const precoAdicionais = (produto.adicionais || [])
    .filter((a) => adicionaisIds.includes(a.id))
    .reduce((soma, a) => soma + Number(a.preco), 0);
  const totalItem = (precoBase + precoAdicionais) * quantidade;

  function alternarAdicional(id) {
    setAdicionaisIds((lista) => lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);
  }

  function confirmar() {
    onAdicionar({ produto, quantidade, adicionaisIds, observacoes });
    onFechar();
  }

  return (
    <Modal titulo={produto.nome} aberto={aberto} onFechar={onFechar} largura={420}>
      <p style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 14 }}>{produto.descricao}</p>

      {!!produto.adicionais?.length && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginBottom: 8 }}>Adicionais</label>
          {produto.adicionais.map((a) => (
            <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'none', color: 'var(--texto)', padding: '5px 0', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={adicionaisIds.includes(a.id)} onChange={() => alternarAdicional(a.id)} />
              {a.nome} (+{fmtPreco(a.preco)})
            </label>
          ))}
        </div>
      )}

      <label>Observações do item</label>
      <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Ex: sem cebola, ponto da carne..." style={{ marginBottom: 16 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="btn-outline" style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }} onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
          <span style={{ fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{quantidade}</span>
          <button type="button" className="btn-outline" style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }} onClick={() => setQuantidade((q) => q + 1)}>+</button>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(totalItem)}</div>
      </div>

      <button type="button" className="btn" style={{ width: '100%' }} onClick={confirmar}>Adicionar ao pedido</button>
    </Modal>
  );
}
