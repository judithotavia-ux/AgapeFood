import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import * as empresaService from '../services/empresaService';
import * as authService from '../services/authService';

function fmtData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Empresas() {
  const { entrarComToken } = useAuth();
  const navigate = useNavigate();

  const [empresas, setEmpresas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [entrandoEm, setEntrandoEm] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    empresaService.listarEmpresas()
      .then(setEmpresas)
      .catch(() => setErro('Não foi possível carregar as empresas.'))
      .finally(() => setCarregando(false));
  }, []);

  async function handleEntrar(id) {
    setErro('');
    setEntrandoEm(id);
    try {
      const tokenAtual = authService.obterToken();
      const { token } = await empresaService.entrarComoEmpresa(id);
      authService.guardarTokenSuperAdmin(tokenAtual);
      await entrarComToken(token);
      navigate('/dashboard');
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível entrar nessa empresa.');
      setEntrandoEm(null);
    }
  }

  return (
    <AdminLayout titulo="Empresas">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <p style={{ color: 'var(--texto2)', fontSize: 13.5, margin: 0, maxWidth: 520 }}>
          Todas as empresas cadastradas na plataforma AgapeFood. Clique em "Entrar" pra acessar o painel de uma empresa como se fosse o admin dela.
        </p>
        <button className="btn" style={{ whiteSpace: 'nowrap' }} onClick={() => navigate('/empresas/nova')}>+ Cadastrar nova empresa</button>
      </div>

      {erro && <div className="erro-msg" style={{ marginBottom: 16 }}>{erro}</div>}

      {carregando ? <p style={{ color: 'var(--texto2)' }}>Carregando…</p> : (
        empresas.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)' }}>Nenhuma empresa cadastrada ainda.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--borda)' }}>
                    <th style={{ padding: '12px 18px' }}>Empresa</th>
                    <th style={{ padding: '12px 18px' }}>Usuários</th>
                    <th style={{ padding: '12px 18px' }}>Status</th>
                    <th style={{ padding: '12px 18px' }}>Cadastrada em</th>
                    <th style={{ padding: '12px 18px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--borda)' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 600 }}>{emp.nome}</td>
                      <td style={{ padding: '12px 18px', color: 'var(--texto2)' }}>{emp._count.usuarios}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: emp.ativo ? 'rgba(88,199,120,.15)' : 'rgba(220,90,90,.15)',
                          color: emp.ativo ? '#58c778' : '#dc5a5a'
                        }}>
                          {emp.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', color: 'var(--texto2)' }}>{fmtData(emp.criadoEm)}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button
                          className="btn"
                          style={{ padding: '6px 14px', fontSize: 12.5 }}
                          disabled={entrandoEm === emp.id}
                          onClick={() => handleEntrar(emp.id)}
                        >
                          {entrandoEm === emp.id ? 'Entrando…' : 'Entrar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </AdminLayout>
  );
}
