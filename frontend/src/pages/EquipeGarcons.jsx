import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as garcomService from '../services/garcomService';

const STATUS_LABEL = { ATIVO: 'Ativo', INATIVO: 'Inativo', FERIAS: 'Férias', AFASTADO: 'Afastado' };
const STATUS_COR = { ATIVO: 'var(--sucesso)', INATIVO: 'var(--texto2)', FERIAS: '#5aa9e6', AFASTADO: '#e0a020' };

const FORM_VAZIO = {
  nome: '', nomeExibicao: '', cpf: '', telefone: '', whatsapp: '', email: '',
  dataNascimento: '', dataAdmissao: '', matricula: '', statusGarcom: 'ATIVO', observacoes: '', senha: ''
};

export default function EquipeGarcons() {
  const [garcons, setGarcons] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [modalSenha, setModalSenha] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  async function carregar() {
    setCarregando(true);
    const lista = await garcomService.listarGarcons();
    setGarcons(lista);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(g) {
    setEditandoId(g.id);
    setForm({
      nome: g.nome || '', nomeExibicao: g.nomeExibicao || '', cpf: g.cpf || '', telefone: g.telefone || '',
      whatsapp: g.whatsapp || '', email: g.email || '',
      dataNascimento: g.dataNascimento ? g.dataNascimento.slice(0, 10) : '',
      dataAdmissao: g.dataAdmissao ? g.dataAdmissao.slice(0, 10) : '',
      matricula: g.matricula || '', statusGarcom: g.statusGarcom || 'ATIVO', observacoes: g.observacoes || '', senha: ''
    });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) return setErro('Informe o nome completo.');
    if (!editandoId && (!form.email.trim() || form.senha.length < 6)) {
      return setErro('Informe e-mail e uma senha com no mínimo 6 caracteres.');
    }
    setSalvando(true);
    setErro('');
    try {
      if (editandoId) {
        const { email, senha, ...dados } = form;
        await garcomService.atualizarGarcom(editandoId, dados);
      } else {
        await garcomService.criarGarcom(form);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(g) {
    if (!confirm(`Desativar ${g.nome}? Ele deixa de aparecer para novos atendimentos.`)) return;
    await garcomService.desativarGarcom(g.id);
    carregar();
  }

  async function salvarSenha(e) {
    e.preventDefault();
    if (novaSenha.length < 6) return setErroSenha('A senha deve ter no mínimo 6 caracteres.');
    try {
      await garcomService.redefinirSenhaGarcom(modalSenha.id, novaSenha);
      setModalSenha(null);
      setNovaSenha('');
    } catch (err) {
      setErroSenha(err.response?.data?.erro || 'Não foi possível redefinir.');
    }
  }

  return (
    <AdminLayout titulo="Equipe de Garçons">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: 'var(--texto2)', fontSize: 13.5, margin: 0 }}>Cadastro da equipe que atende mesas — cada garçom tem seu próprio login.</p>
        <button className="btn" onClick={abrirNovo}>+ Novo Garçom</button>
      </div>

      {carregando ? (
        <div style={{ color: 'var(--texto2)' }}>Carregando…</div>
      ) : garcons.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)', padding: 40 }}>
          Nenhum garçom cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
          {garcons.map((g) => (
            <div key={g.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{g.nomeExibicao || g.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--texto2)' }}>{g.nome}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COR[g.statusGarcom], border: `1px solid ${STATUS_COR[g.statusGarcom]}55`, borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap' }}>
                  {STATUS_LABEL[g.statusGarcom]}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--texto2)', marginTop: 10, lineHeight: 1.7 }}>
                {g.matricula && <div>Matrícula: {g.matricula}</div>}
                {g.telefone && <div>📞 {g.telefone}</div>}
                <div>✉️ {g.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn-outline" style={{ flex: 1, fontSize: 12.5, padding: '8px 10px' }} onClick={() => abrirEdicao(g)}>Editar</button>
                <button className="btn-outline" style={{ fontSize: 12.5, padding: '8px 10px' }} onClick={() => { setModalSenha(g); setNovaSenha(''); setErroSenha(''); }}>Senha</button>
                {g.statusGarcom !== 'INATIVO' && (
                  <button className="btn-outline" style={{ fontSize: 12.5, padding: '8px 10px', color: 'var(--erro)', borderColor: 'rgba(224,102,102,.4)' }} onClick={() => desativar(g)}>Desativar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal titulo={editandoId ? 'Editar garçom' : 'Novo garçom'} aberto={modalAberto} onFechar={() => setModalAberto(false)} largura={520}>
        <form onSubmit={salvar}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Nome completo</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div>
              <label>Nome de exibição</label>
              <input value={form.nomeExibicao} onChange={(e) => setForm({ ...form, nomeExibicao: e.target.value })} placeholder="Como aparece no painel" />
            </div>
          </div>

          {!editandoId && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <label>E-mail de acesso</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label>Senha</label>
                <input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>CPF</label>
              <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </div>
            <div>
              <label>Matrícula / código interno</label>
              <input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Telefone</label>
              <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div>
              <label>WhatsApp</label>
              <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Data de nascimento</label>
              <input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} />
            </div>
            <div>
              <label>Data de admissão</label>
              <input type="date" value={form.dataAdmissao} onChange={(e) => setForm({ ...form, dataAdmissao: e.target.value })} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Status</label>
            <select value={form.statusGarcom} onChange={(e) => setForm({ ...form, statusGarcom: e.target.value })}>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Observações</label>
            <input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>

          {erro && <div className="erro-msg">{erro}</div>}

          <button type="submit" className="btn" style={{ width: '100%', marginTop: 18 }} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
      </Modal>

      <Modal titulo={`Redefinir senha — ${modalSenha?.nome || ''}`} aberto={!!modalSenha} onFechar={() => setModalSenha(null)} largura={380}>
        <form onSubmit={salvarSenha}>
          <label>Nova senha</label>
          <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" autoFocus />
          {erroSenha && <div className="erro-msg">{erroSenha}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Redefinir</button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
