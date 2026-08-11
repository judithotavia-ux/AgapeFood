import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as perfilService from '../services/perfilPersonalizadoService';
import * as permissaoService from '../services/permissaoService';

const PAPEL_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', GERENTE: 'Gerente', FUNCIONARIO: 'Funcionário', GARCOM: 'Garçom' };

function agruparPorModulo(catalogo) {
  const grupos = new Map();
  for (const p of catalogo) {
    if (!grupos.has(p.modulo)) grupos.set(p.modulo, []);
    grupos.get(p.modulo).push(p);
  }
  return [...grupos.entries()];
}

export default function PerfisPersonalizados() {
  const [perfis, setPerfis] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [modalPerfil, setModalPerfil] = useState(null); // null | 'novo' | perfil existente
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState(new Set());
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const grupos = useMemo(() => agruparPorModulo(catalogo), [catalogo]);

  async function carregar() {
    setCarregando(true);
    const [p, c, u] = await Promise.all([perfilService.listarPerfis(), permissaoService.listarCatalogoPermissoes(), perfilService.listarUsuarios()]);
    setPerfis(p); setCatalogo(c); setUsuarios(u);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setModalPerfil('novo');
    setNome(''); setDescricao(''); setPermissoesSelecionadas(new Set()); setErro('');
  }

  function abrirEdicao(perfil) {
    setModalPerfil(perfil);
    setNome(perfil.nome); setDescricao(perfil.descricao || ''); setPermissoesSelecionadas(new Set(perfil.permissoes)); setErro('');
  }

  function alternarPermissao(chave) {
    setPermissoesSelecionadas((atual) => {
      const novo = new Set(atual);
      novo.has(chave) ? novo.delete(chave) : novo.add(chave);
      return novo;
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true); setErro('');
    try {
      const dados = { nome, descricao, permissoes: [...permissoesSelecionadas] };
      if (modalPerfil === 'novo') await perfilService.criarPerfil(dados);
      else await perfilService.atualizarPerfil(modalPerfil.id, dados);
      setModalPerfil(null);
      carregar();
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível salvar o perfil.');
    } finally {
      setSalvando(false);
    }
  }

  async function remover(perfil) {
    if (!confirm(`Remover o perfil "${perfil.nome}"? Quem estiver com ele volta a usar o padrão do papel.`)) return;
    await perfilService.removerPerfil(perfil.id);
    carregar();
  }

  async function mudarPerfilUsuario(usuario, perfilPersonalizadoId) {
    await perfilService.atribuirPerfilAoUsuario(usuario.id, perfilPersonalizadoId || null);
    carregar();
  }

  return (
    <AdminLayout titulo="Perfis Personalizados">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <p style={{ color: 'var(--texto2)', fontSize: 13.5, margin: 0 }}>Crie perfis com um recorte próprio de permissões e atribua a qualquer pessoa da equipe.</p>
        <button className="btn" onClick={abrirNovo}>+ Novo perfil</button>
      </div>

      {carregando ? <p style={{ color: 'var(--texto2)' }}>Carregando…</p> : (
        <>
          {perfis.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)', marginBottom: 20 }}>Nenhum perfil personalizado ainda.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
              {perfis.map((p) => (
                <div key={p.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.nome}</div>
                      {p.descricao && <div style={{ fontSize: 12, color: 'var(--texto2)', marginTop: 2 }}>{p.descricao}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--texto2)', margin: '10px 0' }}>{p.permissoes.length} permissões · {p.usuariosVinculados} pessoa(s)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => abrirEdicao(p)}>Editar</button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 12, cursor: 'pointer' }} onClick={() => remover(p)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Atribuir perfil a alguém da equipe</h3>
            {usuarios.map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--borda)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.nome}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>{u.email} · {PAPEL_LABEL[u.papel]}</div>
                </div>
                <select value={u.perfilPersonalizadoId || ''} onChange={(e) => mudarPerfilUsuario(u, e.target.value)} style={{ maxWidth: 220 }}>
                  <option value="">Padrão do papel ({PAPEL_LABEL[u.papel]})</option>
                  {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal titulo={modalPerfil === 'novo' ? 'Novo perfil' : `Editar "${modalPerfil?.nome}"`} aberto={!!modalPerfil} onFechar={() => setModalPerfil(null)} largura={620}>
        {modalPerfil && (
          <form onSubmit={salvar}>
            <label>Nome do perfil</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Caixa Sênior" style={{ marginBottom: 12 }} />
            <label>Descrição (opcional)</label>
            <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} style={{ marginBottom: 16 }} />

            <label style={{ marginBottom: 8, display: 'block' }}>Permissões</label>
            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--borda)', borderRadius: 8, padding: 12 }}>
              {grupos.map(([modulo, itens]) => (
                <div key={modulo} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, letterSpacing: '.05em', color: 'var(--dourado)', textTransform: 'uppercase', marginBottom: 6 }}>{modulo}</div>
                  {itens.map((p) => (
                    <label key={p.chave} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, padding: '4px 0', cursor: 'pointer' }}>
                      <input type="checkbox" checked={permissoesSelecionadas.has(p.chave)} onChange={() => alternarPermissao(p.chave)} />
                      {p.descricao}
                    </label>
                  ))}
                </div>
              ))}
            </div>

            {erro && <div className="erro-msg" style={{ marginTop: 12 }}>{erro}</div>}
            <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar perfil'}</button>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}
