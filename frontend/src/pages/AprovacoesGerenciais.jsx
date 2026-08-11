import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import * as aprovacaoService from '../services/aprovacaoService';

const PAPEL_LABEL = { FUNCIONARIO: 'Funcionário', GARCOM: 'Garçom' };

function SecaoPin() {
  const { usuario } = useAuth();
  const [pinDefinido, setPinDefinido] = useState(null);
  const [pin, setPin] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { aprovacaoService.obterStatusPin().then((r) => setPinDefinido(r.pinDefinido)); }, []);

  async function salvar(e) {
    e.preventDefault();
    setErro(''); setMensagem(''); setEnviando(true);
    try {
      await aprovacaoService.definirPin(pin, senhaAtual);
      setMensagem('PIN salvo com sucesso.');
      setPinDefinido(true);
      setPin(''); setSenhaAtual('');
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível salvar o PIN.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    if (!confirm('Remover seu PIN de aprovação? Você não vai mais conseguir aprovar exceções até definir um novo.')) return;
    await aprovacaoService.removerPin();
    setPinDefinido(false);
  }

  return (
    <div className="card" style={{ marginBottom: 20, maxWidth: 420 }}>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Meu PIN de aprovação</h3>
      <p style={{ fontSize: 12.5, color: 'var(--texto2)', marginBottom: 14 }}>
        {usuario?.nome?.split(' ')[0]}, esse PIN é o que o caixa vai pedir quando alguém precisar da sua aprovação pra um desconto ou cancelamento acima do limite.
        {pinDefinido === true && <> <strong style={{ color: 'var(--sucesso)' }}>Você já tem um PIN definido.</strong></>}
        {pinDefinido === false && <> Você ainda não tem um PIN — sem ele, não é possível aprovar exceções.</>}
      </p>
      <form onSubmit={salvar}>
        <label>Novo PIN (4 a 6 dígitos)</label>
        <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required style={{ marginBottom: 12 }} />
        <label>Confirme sua senha de login</label>
        <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required style={{ marginBottom: 12 }} />
        {erro && <div className="erro-msg" style={{ marginBottom: 12 }}>{erro}</div>}
        {mensagem && <div style={{ color: 'var(--sucesso)', fontSize: 12.5, marginBottom: 12 }}>✓ {mensagem}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar PIN'}</button>
          {pinDefinido && <button type="button" className="btn-outline" onClick={remover}>Remover PIN</button>}
        </div>
      </form>
    </div>
  );
}

function SecaoLimites() {
  const [limites, setLimites] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoPapel, setSalvandoPapel] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await aprovacaoService.listarLimitesAprovacao();
      setLimites(dados);
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível carregar os limites.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function atualizarCampo(papel, campo, valor) {
    setLimites((atual) => atual.map((l) => (l.papel === papel ? { ...l, [campo]: valor } : l)));
  }

  async function salvar(papel) {
    setSalvandoPapel(papel);
    setErro('');
    const linha = limites.find((l) => l.papel === papel);
    try {
      await aprovacaoService.atualizarLimiteAprovacao(papel, {
        limiteDescontoPercentual: linha.limiteDescontoPercentual === '' ? null : linha.limiteDescontoPercentual,
        limiteDescontoValor: linha.limiteDescontoValor === '' ? null : linha.limiteDescontoValor
      });
    } catch (e) {
      setErro(e.response?.data?.erro || 'Você não tem permissão para alterar esses limites.');
    } finally {
      setSalvandoPapel(null);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Limites de desconto sem aprovação</h3>
      <p style={{ fontSize: 12.5, color: 'var(--texto2)', marginBottom: 14 }}>
        Até esse limite, o próprio funcionário/garçom aplica o desconto. Acima disso, o caixa pede o PIN de um gerente. Deixe em branco pra sempre exigir aprovação.
      </p>
      {erro && <div className="erro-msg" style={{ marginBottom: 12 }}>{erro}</div>}
      {carregando ? <p style={{ color: 'var(--texto2)' }}>Carregando…</p> : (
        limites.map((l) => (
          <div key={l.papel} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--borda)' }}>
            <div style={{ minWidth: 100, fontSize: 13, fontWeight: 600 }}>{PAPEL_LABEL[l.papel]}</div>
            <div style={{ flex: 1 }}>
              <label>Limite em %</label>
              <input type="number" min="0" max="100" step="0.1" value={l.limiteDescontoPercentual ?? ''} onChange={(e) => atualizarCampo(l.papel, 'limiteDescontoPercentual', e.target.value)} placeholder="Sem limite %" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Limite em R$</label>
              <input type="number" min="0" step="0.01" value={l.limiteDescontoValor ?? ''} onChange={(e) => atualizarCampo(l.papel, 'limiteDescontoValor', e.target.value)} placeholder="Sem limite R$" />
            </div>
            <button className="btn-outline" style={{ fontSize: 12.5, padding: '9px 14px' }} onClick={() => salvar(l.papel)} disabled={salvandoPapel === l.papel}>
              {salvandoPapel === l.papel ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default function AprovacoesGerenciais() {
  return (
    <AdminLayout titulo="Aprovações Gerenciais">
      <p style={{ color: 'var(--texto2)', fontSize: 13.5, marginBottom: 22 }}>Configure o PIN que autoriza exceções e o quanto cada papel pode dar de desconto sem precisar de aprovação.</p>
      <SecaoPin />
      <SecaoLimites />
    </AdminLayout>
  );
}
