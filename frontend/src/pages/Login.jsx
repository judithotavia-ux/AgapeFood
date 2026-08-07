import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
      navigate('/dashboard');
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível entrar. Verifique suas credenciais.');
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
      <form onSubmit={handleSubmit} className="card" style={{ width: 380, padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 13, letterSpacing: '.2em', color: 'var(--texto2)', marginBottom: 6 }}>BEM-VINDO AO</div>
          <h1 style={{ fontSize: 30 }}>AgapeFood</h1>
          <div style={{ fontSize: 12, color: 'var(--texto2)', marginTop: 4 }}>Painel administrativo</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
        </div>
        <div>
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" required />
        </div>

        {erro && <div className="erro-msg">{erro}</div>}

        <button type="submit" className="btn" style={{ width: '100%', marginTop: 22 }} disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--texto2)', marginTop: 20 }}>
          Acesso demo: admin@agapefood.com / agape123
        </div>
      </form>
    </div>
  );
}
