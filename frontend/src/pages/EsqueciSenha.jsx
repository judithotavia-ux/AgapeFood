import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../services/authService';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await authService.esqueciSenha(email);
      setEnviado(true);
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível enviar o e-mail agora. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 0%, #1c1707 0%, #0a0a0a 60%)'
    }}>
      <div className="card" style={{ width: 380, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 13, letterSpacing: '.2em', color: 'var(--texto2)', marginBottom: 6 }}>AGAPEFOOD</div>
          <h1 style={{ fontSize: 26 }}>Esqueci minha senha</h1>
          <div style={{ fontSize: 12, color: 'var(--texto2)', marginTop: 4 }}>Enviamos um link de redefinição para o seu e-mail cadastrado.</div>
        </div>

        {enviado ? (
          <div>
            <div style={{ fontSize: 13.5, color: 'var(--texto)', lineHeight: 1.6, marginBottom: 20 }}>
              Se esse e-mail estiver cadastrado, você vai receber uma mensagem em instantes com um link para escolher uma nova senha. Confira também a caixa de spam.
            </div>
            <Link to="/login" className="btn" style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <label>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            <button type="submit" className="btn" style={{ width: '100%', marginTop: 22 }} disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar link de redefinição'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 12.5, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--borda)' }}>
              <Link to="/login" style={{ color: 'var(--dourado)', fontWeight: 600 }}>Voltar para o login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
