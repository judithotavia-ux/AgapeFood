import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import BloqueioPlano from '../components/BloqueioPlano';
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
  const [bloqueado, setBloqueado] = useState(false);
  const [planoAtual, setPlanoAtual] = useState(null);
  const fimRef = useRef(null);

  const [configIA, setConfigIA] = useState(null);
  const [uso, setUso] = useState(null);
  const [modalConfig, setModalConfig] = useState(false);
  const [chaveInput, setChaveInput] = useState('');
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [erroConfig, setErroConfig] = useState('');

  async function carregarConversas() {
    setCarregandoLista(true);
    try {
      const lista = await agapeIaService.listarConversasIA();
      setConversas(lista);
    } catch (e) {
      if (e.response?.data?.precisaUpgrade) { setBloqueado(true); setPlanoAtual(e.response.data.planoAtual); }
      else throw e;
    } finally {
      setCarregandoLista(false);
    }
  }

  async function carregarConfigIA() {
    const cfg = await agapeIaService.obterConfigIA();
    setConfigIA(cfg);
  }

  async function carregarUso() {
    try {
      const dados = await agapeIaService.obterUsoIA();
      setUso(dados);
    } catch {
      // se estiver bloqueado por plano, carregarConversas ja trata a mensagem - aqui so ignora
    }
  }

  useEffect(() => { carregarConversas(); carregarConfigIA(); carregarUso(); }, []);

  function abrirModalConfig() {
    setChaveInput('');
    setErroConfig('');
    setModalConfig(true);
  }

  async function salvarChaveIA(e) {
    e.preventDefault();
    if (!chaveInput.trim()) return setErroConfig('Cole sua chave da Anthropic (começa com "sk-ant-").');
    setSalvandoConfig(true);
    setErroConfig('');
    try {
      const cfg = await agapeIaService.salvarConfigIA(chaveInput.trim());
      setConfigIA(cfg);
      setModalConfig(false);
      setErro('');
    } catch (err) {
      setErroConfig(err.response?.data?.erro || 'Não foi possível salvar a chave.');
    } finally {
      setSalvandoConfig(false);
    }
  }

  async function removerChaveIA() {
    if (!confirm('Remover a chave da Anthropic? A Ágape IA para de funcionar até você configurar uma nova.')) return;
    setSalvandoConfig(true);
    try {
      const cfg = await agapeIaService.removerConfigIA();
      setConfigIA(cfg);
      setModalConfig(false);
    } finally {
      setSalvandoConfig(false);
    }
  }

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
      carregarUso();
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

  if (bloqueado) return <AdminLayout titulo="Ágape IA"><BloqueioPlano planoAtual={planoAtual} /></AdminLayout>;

  return (
    <AdminLayout titulo="Ágape IA">
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 130px)' }}>
        <aside style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn" onClick={novaConversa} style={{ width: '100%' }}>+ Nova conversa</button>
          <Link to="/agape-ia/dashboard" style={{ fontSize: 12.5, color: 'var(--texto2)', textAlign: 'center', textDecoration: 'underline' }}>
            Ver dashboard da IA →
          </Link>
          <button
            className="btn-outline"
            onClick={abrirModalConfig}
            style={{ width: '100%', fontSize: 12.5, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            ⚙️ {configIA?.configurada ? 'Chave configurada' : 'Configurar chave'}
          </button>
          {uso?.limite !== null && uso?.limite !== undefined && (
            <div style={{ fontSize: 11, color: uso.restantes === 0 ? 'var(--erro)' : 'var(--texto2)', textAlign: 'center' }}>
              {uso.usadas}/{uso.limite} mensagens este mês
            </div>
          )}
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
          {uso?.limite !== null && uso?.limite !== undefined && uso.restantes === 0 && (
            <div style={{
              margin: '16px 22px 0', padding: '12px 16px', borderRadius: 10,
              background: 'rgba(224,102,102,.08)', border: '1px solid var(--erro)',
              fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
            }}>
              <span>⚠️ Limite mensal de {uso.limite} mensagens atingido. Traga sua própria chave da Anthropic pra uso ilimitado.</span>
              <button className="btn" style={{ padding: '7px 14px', fontSize: 12.5, flexShrink: 0 }} onClick={abrirModalConfig}>Configurar chave</button>
            </div>
          )}

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

      <Modal titulo="Configurar chave da Ágape IA" aberto={modalConfig} onFechar={() => setModalConfig(false)}>
        <p style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 16 }}>
          A Ágape IA já vem pronta pra usar no plano Completo, com um limite de mensagens por mês. Isso aqui é opcional: se você quiser uso ilimitado, pode trazer sua própria chave da Anthropic — nesse caso, o uso e o pagamento passam a ser diretamente com a Anthropic, fora do limite mensal.
        </p>
        <ol style={{ fontSize: 12.5, color: 'var(--texto2)', paddingLeft: 18, marginBottom: 18, lineHeight: 1.8 }}>
          <li>Acesse <strong>console.anthropic.com</strong> e crie uma conta</li>
          <li>Em <strong>Billing</strong>, adicione um cartão / crédito</li>
          <li>Em <strong>API Keys</strong>, gere uma chave nova</li>
          <li>Cole a chave abaixo</li>
        </ol>

        {configIA?.configurada && (
          <div style={{ fontSize: 13, marginBottom: 14, padding: '10px 12px', background: 'var(--preto3)', borderRadius: 8 }}>
            Chave atual: <strong>{configIA.chaveMascarada}</strong>
          </div>
        )}

        <form onSubmit={salvarChaveIA}>
          <label>Chave da Anthropic</label>
          <input
            type="password"
            value={chaveInput}
            onChange={(e) => setChaveInput(e.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
          />
          {erroConfig && <div className="erro-msg">{erroConfig}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button type="submit" className="btn" disabled={salvandoConfig} style={{ flex: 1 }}>
              {salvandoConfig ? 'Salvando…' : 'Salvar chave'}
            </button>
            {configIA?.configurada && (
              <button type="button" className="btn-outline" onClick={removerChaveIA} disabled={salvandoConfig}>
                Remover
              </button>
            )}
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
