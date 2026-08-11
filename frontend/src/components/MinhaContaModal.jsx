import { useEffect, useState } from 'react';
import ModalPublico from './ModalPublico';
import * as clientePortalService from '../services/clientePortalService';
import * as clienteAuthService from '../services/clienteAuthService';

const ABAS = [
  { id: 'pedidos', label: 'Meus pedidos' },
  { id: 'enderecos', label: 'Endereços' },
  { id: 'favoritos', label: 'Favoritos' }
];

const STATUS_LABEL = {
  RECEBIDO: 'Recebido', PREPARANDO: 'Preparando', PRONTO: 'Pronto',
  SAIU_PARA_ENTREGA: 'Saiu para entrega', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado'
};

function fmtPreco(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}
function fmtData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const campoStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #333', background: '#0a0a0a', color: '#f2ead9', fontSize: 13.5, marginBottom: 10 };

export default function MinhaContaModal({ aberto, onFechar, cliente, onSair, cor }) {
  const [aba, setAba] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [formEndereco, setFormEndereco] = useState(false);
  const [novoEndereco, setNovoEndereco] = useState({ apelido: 'Casa', endereco: '', numero: '', bairro: '', cidade: '', complemento: '', principal: false });

  async function carregar() {
    setCarregando(true);
    const [p, e, f] = await Promise.all([
      clientePortalService.meusPedidos(),
      clientePortalService.listarEnderecos(),
      clientePortalService.listarFavoritos()
    ]);
    setPedidos(p); setEnderecos(e); setFavoritos(f);
    setCarregando(false);
  }

  useEffect(() => { if (aberto) carregar(); }, [aberto]);

  async function salvarEndereco(e) {
    e.preventDefault();
    if (!novoEndereco.endereco.trim()) return;
    await clientePortalService.criarEndereco(novoEndereco);
    setNovoEndereco({ apelido: 'Casa', endereco: '', numero: '', bairro: '', cidade: '', complemento: '', principal: false });
    setFormEndereco(false);
    carregar();
  }

  async function excluirEndereco(id) {
    if (!confirm('Remover esse endereço?')) return;
    await clientePortalService.removerEndereco(id);
    carregar();
  }

  async function removerDosFavoritos(produtoId) {
    await clientePortalService.removerFavorito(produtoId);
    carregar();
  }

  function sair() {
    clienteAuthService.logoutCliente();
    onSair();
    onFechar();
  }

  return (
    <ModalPublico titulo={`Olá, ${cliente?.nome?.split(' ')[0] || ''}`} aberto={aberto} onFechar={onFechar} cor={cor} largura={480}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid #2a2a2a', paddingBottom: 10 }}>
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            style={{
              padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5,
              background: aba === a.id ? `${cor}22` : 'transparent', color: aba === a.id ? cor : '#b8ac8e'
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {carregando && <div style={{ color: '#b8ac8e', fontSize: 13, textAlign: 'center', padding: 20 }}>Carregando…</div>}

      {!carregando && aba === 'pedidos' && (
        <div>
          {pedidos.length === 0 && <div style={{ color: '#b8ac8e', fontSize: 13 }}>Você ainda não fez nenhum pedido.</div>}
          {pedidos.map((p) => (
            <div key={p.id} style={{ borderBottom: '1px solid #2a2a2a', padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 600 }}>
                <span>Pedido #{p.numero}</span>
                <span style={{ color: cor }}>{fmtPreco(p.valorTotal)}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#b8ac8e', marginTop: 2 }}>
                {fmtData(p.criadoEm)} · {STATUS_LABEL[p.status] || p.status}
              </div>
              <div style={{ fontSize: 12, color: '#d8d0bc', marginTop: 6 }}>
                {p.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {!carregando && aba === 'enderecos' && (
        <div>
          {enderecos.map((e) => (
            <div key={e.id} style={{ borderBottom: '1px solid #2a2a2a', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.apelido} {e.principal && <span style={{ color: cor, fontSize: 10.5 }}>· PRINCIPAL</span>}</div>
                <div style={{ fontSize: 12, color: '#b8ac8e', marginTop: 2 }}>{e.endereco}, {e.numero} {e.bairro ? `— ${e.bairro}` : ''}</div>
              </div>
              <button onClick={() => excluirEndereco(e.id)} style={{ background: 'none', border: 'none', color: '#e06666', fontSize: 12, cursor: 'pointer' }}>Remover</button>
            </div>
          ))}

          {!formEndereco && (
            <button onClick={() => setFormEndereco(true)} style={{ width: '100%', marginTop: 14, padding: '10px', borderRadius: 8, border: `1px dashed ${cor}55`, background: 'transparent', color: cor, fontSize: 13, cursor: 'pointer' }}>
              + Adicionar endereço
            </button>
          )}

          {formEndereco && (
            <form onSubmit={salvarEndereco} style={{ marginTop: 14 }}>
              <input style={campoStyle} placeholder="Apelido (ex: Casa, Trabalho)" value={novoEndereco.apelido} onChange={(e) => setNovoEndereco({ ...novoEndereco, apelido: e.target.value })} />
              <input style={campoStyle} placeholder="Endereço" value={novoEndereco.endereco} onChange={(e) => setNovoEndereco({ ...novoEndereco, endereco: e.target.value })} required />
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={campoStyle} placeholder="Número" value={novoEndereco.numero} onChange={(e) => setNovoEndereco({ ...novoEndereco, numero: e.target.value })} />
                <input style={campoStyle} placeholder="Bairro" value={novoEndereco.bairro} onChange={(e) => setNovoEndereco({ ...novoEndereco, bairro: e.target.value })} />
              </div>
              <input style={campoStyle} placeholder="Complemento (opcional)" value={novoEndereco.complemento} onChange={(e) => setNovoEndereco({ ...novoEndereco, complemento: e.target.value })} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: cor, color: '#16130a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Salvar</button>
                <button type="button" onClick={() => setFormEndereco(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#b8ac8e', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {!carregando && aba === 'favoritos' && (
        <div>
          {favoritos.length === 0 && <div style={{ color: '#b8ac8e', fontSize: 13 }}>Você ainda não favoritou nenhum produto.</div>}
          {favoritos.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a2a2a', padding: '10px 0' }}>
              <div>
                <div style={{ fontSize: 13.5 }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: cor, marginTop: 2 }}>{fmtPreco(p.precoPromocional ?? p.preco)}</div>
              </div>
              <button onClick={() => removerDosFavoritos(p.id)} style={{ background: 'none', border: 'none', color: '#e06666', fontSize: 18, cursor: 'pointer' }}>♥</button>
            </div>
          ))}
        </div>
      )}

      <button onClick={sair} style={{ width: '100%', marginTop: 22, padding: '11px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#b8ac8e', fontSize: 13, cursor: 'pointer' }}>
        Sair da conta
      </button>
    </ModalPublico>
  );
}
