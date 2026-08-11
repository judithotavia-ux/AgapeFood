import { useEffect, useState } from 'react';
import ModalPublico from './ModalPublico';

function fmtPreco(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

export default function AdicionarAoCarrinhoModal({ produto, aberto, onFechar, onAdicionar, cor }) {
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
  const adicionaisSelecionados = (produto.adicionais || []).filter((a) => adicionaisIds.includes(a.id));
  const precoAdicionais = adicionaisSelecionados.reduce((soma, a) => soma + Number(a.preco), 0);
  const totalItem = (precoBase + precoAdicionais) * quantidade;

  function alternarAdicional(id) {
    setAdicionaisIds((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));
  }

  function confirmar() {
    onAdicionar({
      produtoId: produto.id, nome: produto.nome, precoUnitario: precoBase + precoAdicionais,
      quantidade, adicionaisIds, adicionaisSelecionados, observacoes,
      chaveCarrinho: `${produto.id}-${adicionaisIds.slice().sort().join(',')}-${observacoes}`
    });
    onFechar();
  }

  return (
    <ModalPublico titulo={produto.nome} aberto={aberto} onFechar={onFechar} cor={cor}>
      {produto.descricao && <p style={{ fontSize: 13, color: '#b8ac8e', marginBottom: 14 }}>{produto.descricao}</p>}

      {!!produto.adicionais?.length && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: '#b8ac8e', marginBottom: 8 }}>Adicionais</div>
          {produto.adicionais.map((a) => (
            <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, padding: '7px 0', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={adicionaisIds.includes(a.id)} onChange={() => alternarAdicional(a.id)} />
              {a.nome} (+{fmtPreco(a.preco)})
            </label>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: '#b8ac8e', marginBottom: 6 }}>Alguma observação?</div>
        <input
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: sem cebola, ponto da carne..."
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#0a0a0a', color: '#f2ead9', fontSize: 13.5 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={btnQtd(cor)} onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
          <span style={{ fontSize: 16, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{quantidade}</span>
          <button type="button" style={btnQtd(cor)} onClick={() => setQuantidade((q) => q + 1)}>+</button>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: cor }}>{fmtPreco(totalItem)}</div>
      </div>

      <button type="button" onClick={confirmar} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: cor, color: '#16130a', fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>
        Adicionar ao carrinho
      </button>
    </ModalPublico>
  );
}

function btnQtd(cor) {
  return { width: 34, height: 34, borderRadius: 9, border: `1px solid ${cor}55`, background: 'transparent', color: cor, fontSize: 17, cursor: 'pointer' };
}
