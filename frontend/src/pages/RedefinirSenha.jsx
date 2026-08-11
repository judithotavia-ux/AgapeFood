import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authService from '../services/authService';

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!token) return setErro('Link inválido. Peça um novo link de redefinição.');
    if (novaSenha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres.');
    if (novaSenha !== confirmarSenha) return setErro('As senhas não coincidem.');

    setEnviando(true);
    try {
      await authService.redefinirSenha(token, novaSenha);
      setSucesso(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível redefinir a senha agora.');
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
          <h1 style={{ fontSize: 26 }}>Nova senha</h1>
        </div>

        {sucesso ? (
          <div style={{ fontSize: 13.5, color: 'var(--sucesso)', textAlign: 'center' }}>
            Senha redefinida com sucesso! Levando você para o login…
          </div>
        ) : !token ? (
          <div>
            <div className="erro-msg">Esse link é inválido. Peça um novo link em "Esqueci minha senha".</div>
            <Link to="/esqueci-senha" className="btn" style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 16 }}>
              Pedir novo link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label>Nova senha</label>
              <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="••••••••" required autoFocus />
            </div>
            <div>
              <label>Confirmar nova senha</label>
              <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="••••••••" required />
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            <button type="submit" className="btn" style={{ width: '100%', marginTop: 22 }} disabled={enviando}>
              {enviando ? 'Salvando…' : 'Redefinir senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
