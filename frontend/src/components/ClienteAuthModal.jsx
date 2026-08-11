import { useState } from 'react';
import ModalPublico from './ModalPublico';
import * as clienteAuthService from '../services/clienteAuthService';

const ETAPAS = { TELEFONE: 'TELEFONE', CADASTRO: 'CADASTRO', CODIGO: 'CODIGO' };

const campoStyle = { width: '100%', padding: '11px 13px', borderRadius: 8, border: '1px solid #333', background: '#0a0a0a', color: '#f2ead9', fontSize: 14, marginBottom: 4 };
const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: '#b8ac8e', display: 'block', marginBottom: 6, marginTop: 14 };

export default function ClienteAuthModal({ aberto, onFechar, onAutenticado, slugEmpresa, cor }) {
  const [etapa, setEtapa] = useState(ETAPAS.TELEFONE);
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [emailMascarado, setEmailMascarado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  function reiniciar() {
    setEtapa(ETAPAS.TELEFONE); setTelefone(''); setNome(''); setEmail(''); setCodigo(''); setErro('');
  }

  function fechar() {
    reiniciar();
    onFechar();
  }

  async function enviarTelefone(e) {
    e.preventDefault();
    if (!telefone.trim()) return setErro('Informe seu telefone.');
    setErro(''); setEnviando(true);
    try {
      const r = await clienteAuthService.solicitarAcesso({ telefone, slugEmpresa });
      if (r.enviado) {
        setEmailMascarado(r.emailMascarado);
        setEtapa(ETAPAS.CODIGO);
      } else {
        setEtapa(ETAPAS.CADASTRO);
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível continuar agora.');
    } finally {
      setEnviando(false);
    }
  }

  async function enviarCadastro(e) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return setErro('Preencha nome e e-mail.');
    setErro(''); setEnviando(true);
    try {
      const r = await clienteAuthService.solicitarAcesso({ telefone, nome, email, slugEmpresa });
      if (r.enviado) {
        setEmailMascarado(r.emailMascarado);
        setEtapa(ETAPAS.CODIGO);
      } else {
        setErro('Não foi possível enviar o código. Tente novamente.');
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível continuar agora.');
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCodigo(e) {
    e.preventDefault();
    if (codigo.length !== 6) return setErro('Digite o código de 6 dígitos.');
    setErro(''); setEnviando(true);
    try {
      const r = await clienteAuthService.verificarOtp({ telefone, codigo, slugEmpresa });
      onAutenticado(r.cliente);
      fechar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Código inválido.');
    } finally {
      setEnviando(false);
    }
  }

  const titulos = { TELEFONE: 'Entrar', CADASTRO: 'Criar sua conta', CODIGO: 'Digite o código' };

  return (
    <ModalPublico titulo={titulos[etapa]} aberto={aberto} onFechar={fechar} cor={cor}>
      {etapa === ETAPAS.TELEFONE && (
        <form onSubmit={enviarTelefone}>
          <p style={{ fontSize: 13, color: '#b8ac8e', marginBottom: 4 }}>Informe seu telefone pra entrar ou criar sua conta.</p>
          <label style={labelStyle}>Telefone</label>
          <input style={campoStyle} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(92) 99999-9999" autoFocus />
          {erro && <div style={{ color: '#e06666', fontSize: 12.5, marginTop: 10 }}>{erro}</div>}
          <button type="submit" disabled={enviando} style={botaoStyle(cor)}>{enviando ? 'Aguarde…' : 'Continuar'}</button>
        </form>
      )}

      {etapa === ETAPAS.CADASTRO && (
        <form onSubmit={enviarCadastro}>
          <p style={{ fontSize: 13, color: '#b8ac8e', marginBottom: 4 }}>Primeiro acesso — como podemos te chamar, e pra qual e-mail enviamos o código?</p>
          <label style={labelStyle}>Nome</label>
          <input style={campoStyle} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" autoFocus />
          <label style={labelStyle}>E-mail</label>
          <input style={campoStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
          {erro && <div style={{ color: '#e06666', fontSize: 12.5, marginTop: 10 }}>{erro}</div>}
          <button type="submit" disabled={enviando} style={botaoStyle(cor)}>{enviando ? 'Enviando…' : 'Enviar código'}</button>
        </form>
      )}

      {etapa === ETAPAS.CODIGO && (
        <form onSubmit={confirmarCodigo}>
          <p style={{ fontSize: 13, color: '#b8ac8e', marginBottom: 4 }}>Enviamos um código de 6 dígitos para {emailMascarado || 'seu e-mail'}.</p>
          <label style={labelStyle}>Código</label>
          <input
            style={{ ...campoStyle, letterSpacing: 6, fontSize: 20, textAlign: 'center' }}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            autoFocus
          />
          {erro && <div style={{ color: '#e06666', fontSize: 12.5, marginTop: 10 }}>{erro}</div>}
          <button type="submit" disabled={enviando} style={botaoStyle(cor)}>{enviando ? 'Verificando…' : 'Entrar'}</button>
          <button type="button" onClick={() => setEtapa(ETAPAS.TELEFONE)} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: '#b8ac8e', fontSize: 12.5, cursor: 'pointer', textDecoration: 'underline' }}>
            Usar outro telefone
          </button>
        </form>
      )}
    </ModalPublico>
  );
}

function botaoStyle(cor) {
  return { width: '100%', marginTop: 22, padding: '13px', borderRadius: 10, border: 'none', background: cor, color: '#16130a', fontWeight: 700, fontSize: 14.5, cursor: 'pointer' };
}
