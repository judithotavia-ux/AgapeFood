import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import * as agapeIaService from '../services/agapeIaService';

const SUGESTOES = [
  'Quais produtos estão com estoque baixo?',
  'Como está o financeiro este mês?',
  'Crie uma promoção de 10% para clientes inativos',
  'Quais são meus clientes VIP?'
];

function BolhaMensagem({ papel, conteudo }) {
  const deUsuario = papel === 'USUARIO';
  return (
    <div style={{ display: 'flex', justifyContent: deUsuario ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '72%',
          padding: '12px 16px',
          borderRadius: 14,
          borderBottomRightRadius: deUsuario ? 4 : 14,
          borderBottomLeftRadius: deUsuario ? 14 : 4,
          background: deUsuario ? 'var(--dourado)' : 'var(--preto2)',
          border: deUsuario ? 'none' : '1px solid var(--borda)',
          color: deUsuario ? '#16130a' : 'var(--texto)',
          fontSize: 14.5,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap'
        }}
      >
        {conteudo}
      </div>
    </div>
  );
}

export default function AgapeIAChat() {
  const [conversas, setConversas] = useState([]);
  const [conversaId, setConversaId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [carregandoLista, setCarregandoLista] = useState(true);
  const fimRef = useRef(null);

  async function carregarConversas() {
    setCarregandoLista(true);
    const lista = await agapeIaService.listarConversasIA();
    setConversas(lista);
    setCarregandoLista(false);
  }

  useEffect(() => { carregarConversas(); }, []);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, enviando]);

  async function abrirConversa(id) {
    setErro('');
    setConversaId(id);
    const { mensagens: msgs } = await agapeIaService.obterConversaIA(id);
    setMensagens(msgs);
  }

  function novaConversa() {
    setConversaId(null);
    setMensagens([]);
    setErro('');
  }

  async function excluir(id, ev) {
    ev.stopPropagation();
    if (!confirm('Excluir essa conversa?')) return;
    await agapeIaService.excluirConversaIA(id);
    if (conversaId === id) novaConversa();
    carregarConversas();
  }

  async function enviar(textoForcado) {
    const mensagem = (textoForcado ?? texto).trim();
    if (!mensagem || enviando) return;

    setErro('');
    setTexto('');
    setEnviando(true);
    setMensagens((atual) => [...atual, { papel: 'USUARIO', conteudo: mensagem, id: `tmp-${Date.now()}` }]);

    try {
      const resposta = await agapeIaService.enviarMensagem({ texto: mensagem, conversaId: conversaId || undefined });
      setConversaId(resposta.conversaId);
      setMensagens((atual) => [...atual, { papel: 'ASSISTENTE', conteudo: resposta.texto, id: `resp-${Date.now()}` }]);
      carregarConversas();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível falar com a Ágape IA agora.');
      setMensagens((atual) => atual.slice(0, -1));
      setTexto(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <AdminLayout titulo="Ágape IA">
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 130px)' }}>
        <aside style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn" onClick={novaConversa} style={{ width: '100%' }}>+ Nova conversa</button>
          <Link to="/agape-ia/dashboard" style={{ fontSize: 12.5, color: 'var(--texto2)', textAlign: 'center', textDecoration: 'underline' }}>
            Ver dashboard da IA →
          </Link>
          <div className="card" style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {carregandoLista && <div style={{ fontSize: 12.5, color: 'var(--texto2)', padding: 10 }}>Carregando…</div>}
            {!carregandoLista && conversas.length === 0 && (
              <div style={{ fontSize: 12.5, color: 'var(--texto2)', padding: 10 }}>Nenhuma conversa ainda.</div>
            )}
            {conversas.map((c) => (
              <div
                key={c.id}
                onClick={() => abrirConversa(c.id)}
                style={{
                  padding: '9px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: c.id === conversaId ? 'rgba(212,175,55,.12)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                  marginBottom: 2
                }}
              >
                <span style={{
                  fontSize: 13, color: c.id === conversaId ? 'var(--dourado)' : 'var(--texto)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {c.titulo || 'Conversa'}
                </span>
                <span
                  onClick={(ev) => excluir(c.id, ev)}
                  title="Excluir"
                  style={{ fontSize: 12, color: 'var(--texto2)', flexShrink: 0 }}
                >
                  ✕
                </span>
              </div>
            ))}
          </div>
        </aside>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mensagens.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 420 }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>🤖</div>
                <h3 style={{ marginBottom: 6 }}>Ágape IA</h3>
                <p style={{ color: 'var(--texto2)', fontSize: 13.5, marginBottom: 18 }}>
                  Pergunte sobre produtos, estoque, pedidos, clientes ou financeiro — ou peça para criar uma promoção, campanha, tarefa ou relatório.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {SUGESTOES.map((s) => (
                    <button key={s} className="btn-outline" style={{ fontSize: 12.5, textAlign: 'left', padding: '9px 14px' }} onClick={() => enviar(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((m) => <BolhaMensagem key={m.id} papel={m.papel} conteudo={m.conteudo} />)}

            {enviando && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: 14, borderBottomLeftRadius: 4,
                  border: '1px solid var(--borda)', color: 'var(--texto2)', fontSize: 13.5
                }}>
                  Ágape IA está pensando…
                </div>
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {erro && <div className="erro-msg" style={{ margin: '0 22px' }}>{erro}</div>}

          <div style={{ padding: 16, borderTop: '1px solid var(--borda)', display: 'flex', gap: 10 }}>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo ou peça uma ação à Ágape IA…"
              rows={1}
              style={{ resize: 'none', flex: 1 }}
              disabled={enviando}
            />
            <button className="btn" onClick={() => enviar()} disabled={enviando || !texto.trim()}>Enviar</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
