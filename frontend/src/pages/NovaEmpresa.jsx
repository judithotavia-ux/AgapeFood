import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import * as empresaService from '../services/empresaService';
import * as assinaturaService from '../services/assinaturaService';
import * as authService from '../services/authService';
import { mascaraCnpj, mascaraCpf, mascaraCep, mascaraTelefone, TIPO_EMPRESA_LABEL } from '../utils/mascaras';

const ABAS = ['Dados da Empresa', 'Endereço', 'Contatos', 'Responsável', 'Plano'];

const CAMPOS_EMPRESA_INICIAIS = {
  nomeFantasia: '', razaoSocial: '', cnpj: '', inscricaoEstadual: '', inscricaoMunicipal: '',
  dataFundacao: '', tipoEmpresa: 'RESTAURANTE', regimeTributario: '', ramoAtividade: '', descricao: ''
};
const CAMPOS_ENDERECO_INICIAIS = { cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', pais: 'Brasil' };
const CAMPOS_CONTATOS_INICIAIS = { telefone: '', whatsapp: '', email: '', site: '', instagram: '', facebook: '', tiktok: '', youtube: '' };
const CAMPOS_RESPONSAVEL_INICIAIS = { nome: '', cpf: '', rg: '', dataNascimento: '', telefone: '', email: '', senha: '', confirmarSenha: '' };

function fmtPreco(preco) {
  return Number(preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function NovaEmpresa() {
  const { entrarComToken } = useAuth();
  const navigate = useNavigate();

  const [aba, setAba] = useState(0);
  const [empresa, setEmpresa] = useState(CAMPOS_EMPRESA_INICIAIS);
  const [endereco, setEndereco] = useState(CAMPOS_ENDERECO_INICIAIS);
  const [contatos, setContatos] = useState(CAMPOS_CONTATOS_INICIAIS);
  const [responsavel, setResponsavel] = useState(CAMPOS_RESPONSAVEL_INICIAIS);
  const [planos, setPlanos] = useState([]);
  const [planoId, setPlanoId] = useState('');

  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    assinaturaService.listarPlanos().then((lista) => {
      setPlanos(lista);
      if (lista.length) setPlanoId(lista[0].id);
    });
  }, []);

  const setE = (campo, valor) => setEmpresa((c) => ({ ...c, [campo]: valor }));
  const setEnd = (campo, valor) => setEndereco((c) => ({ ...c, [campo]: valor }));
  const setC = (campo, valor) => setContatos((c) => ({ ...c, [campo]: valor }));
  const setR = (campo, valor) => setResponsavel((c) => ({ ...c, [campo]: valor }));

  async function handleBuscarCnpj() {
    const digitos = empresa.cnpj.replace(/\D/g, '');
    if (digitos.length !== 14) return;
    setBuscandoCnpj(true);
    try {
      const dados = await empresaService.buscarCnpj(digitos);
      setEmpresa((c) => ({
        ...c,
        razaoSocial: c.razaoSocial || dados.razaoSocial,
        nomeFantasia: c.nomeFantasia || dados.nomeFantasia || dados.razaoSocial,
        ramoAtividade: c.ramoAtividade || dados.ramoAtividade,
        dataFundacao: c.dataFundacao || (dados.dataFundacao ? dados.dataFundacao.slice(0, 10) : '')
      }));
      setEndereco((c) => ({
        ...c,
        cep: c.cep || mascaraCep(dados.cep),
        endereco: c.endereco || dados.endereco,
        numero: c.numero || dados.numero,
        complemento: c.complemento || dados.complemento,
        bairro: c.bairro || dados.bairro,
        cidade: c.cidade || dados.cidade,
        estado: c.estado || dados.estado
      }));
      setContatos((c) => ({ ...c, telefone: c.telefone || mascaraTelefone(dados.telefone) }));
    } catch (e) {
      // CNPJ nao encontrado ou API fora do ar - segue com preenchimento manual, sem bloquear o cadastro
    } finally {
      setBuscandoCnpj(false);
    }
  }

  async function handleBuscarCep() {
    const digitos = endereco.cep.replace(/\D/g, '');
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    try {
      const dados = await empresaService.buscarCep(digitos);
      setEndereco((c) => ({ ...c, endereco: dados.endereco || c.endereco, bairro: dados.bairro || c.bairro, cidade: dados.cidade || c.cidade, estado: dados.estado || c.estado }));
    } catch (e) {
      // CEP nao encontrado - segue com preenchimento manual
    } finally {
      setBuscandoCep(false);
    }
  }

  function validarAba(indice) {
    if (indice === 0 && !empresa.nomeFantasia.trim()) return 'Informe o nome fantasia da empresa.';
    if (indice === 3) {
      if (!responsavel.nome.trim()) return 'Informe o nome do responsável.';
      if (!responsavel.email.trim()) return 'Informe o e-mail do responsável.';
      if (!responsavel.senha || responsavel.senha.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
      if (responsavel.senha !== responsavel.confirmarSenha) return 'As senhas não coincidem.';
    }
    if (indice === 4 && !planoId) return 'Selecione um plano para a empresa.';
    return '';
  }

  function irParaProxima() {
    const msg = validarAba(aba);
    if (msg) return setErro(msg);
    setErro('');
    setAba((a) => Math.min(ABAS.length - 1, a + 1));
  }

  function irParaAnterior() {
    setErro('');
    setAba((a) => Math.max(0, a - 1));
  }

  async function finalizarCadastro(e) {
    e.preventDefault();
    const msg = validarAba(4);
    if (msg) return setErro(msg);
    setErro('');
    setEnviando(true);
    try {
      const resposta = await empresaService.cadastrarEmpresaComoAdmin({ empresa, endereco, contatos, responsavel, planoId });
      setResultado(resposta);
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível concluir o cadastro.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleEntrarAgora() {
    setEntrando(true);
    try {
      const tokenAtual = authService.obterToken();
      const { token } = await empresaService.entrarComoEmpresa(resultado.empresa.id);
      authService.guardarTokenSuperAdmin(tokenAtual);
      await entrarComToken(token);
      navigate('/dashboard');
    } catch (e) {
      setErro('Empresa cadastrada, mas não foi possível entrar nela agora. Tente pela lista de Empresas.');
      setEntrando(false);
    }
  }

  if (resultado) {
    return (
      <AdminLayout titulo="Cadastrar Empresa">
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 style={{ marginBottom: 12 }}>Empresa cadastrada! 🎉</h3>
          <p style={{ fontSize: 13.5, color: 'var(--texto2)', marginBottom: 16 }}>
            <strong>{resultado.empresa.nome}</strong> já está no sistema, no plano <strong>{resultado.plano.nome}</strong> (trial de 14 dias).
          </p>
          <p style={{ fontSize: 13.5, marginBottom: 20 }}>
            Login do responsável: <strong>{resultado.admin.email}</strong> (com a senha que você definiu agora)
          </p>
          {erro && <div className="erro-msg" style={{ marginBottom: 16 }}>{erro}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" style={{ flex: 1 }} disabled={entrando} onClick={handleEntrarAgora}>
              {entrando ? 'Entrando…' : 'Entrar nessa empresa agora'}
            </button>
            <button className="btn-outline" style={{ flex: 1, borderRadius: 10 }} onClick={() => navigate('/empresas')}>Ver todas as empresas</button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titulo="Cadastrar Empresa">
      <div className="card" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 26, flexWrap: 'wrap' }}>
          {ABAS.map((nome, i) => (
            <div key={nome} style={{ flex: 1, textAlign: 'center', minWidth: 90 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', margin: '0 auto 6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                background: i <= aba ? 'var(--dourado)' : 'var(--preto3)', color: i <= aba ? '#16130a' : 'var(--texto2)'
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 10.5, color: i === aba ? 'var(--dourado)' : 'var(--texto2)' }}>{nome}</div>
            </div>
          ))}
        </div>

        <form onSubmit={finalizarCadastro}>
          {aba === 0 && (
            <div>
              <label>Nome Fantasia *</label>
              <input value={empresa.nomeFantasia} onChange={(e) => setE('nomeFantasia', e.target.value)} autoFocus />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>CNPJ</label>
                  <input value={empresa.cnpj} onChange={(e) => setE('cnpj', mascaraCnpj(e.target.value))} onBlur={handleBuscarCnpj} placeholder="00.000.000/0000-00" />
                  {buscandoCnpj && <div style={{ fontSize: 10.5, color: 'var(--texto2)', marginTop: 4 }}>Buscando dados do CNPJ…</div>}
                </div>
                <div>
                  <label>Razão Social</label>
                  <input value={empresa.razaoSocial} onChange={(e) => setE('razaoSocial', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>Data de Fundação</label>
                  <input type="date" value={empresa.dataFundacao} onChange={(e) => setE('dataFundacao', e.target.value)} />
                </div>
                <div>
                  <label>Tipo de Empresa</label>
                  <select value={empresa.tipoEmpresa} onChange={(e) => setE('tipoEmpresa', e.target.value)}>
                    {Object.entries(TIPO_EMPRESA_LABEL).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
                  </select>
                </div>
              </div>

              <label style={{ marginTop: 12 }}>Descrição</label>
              <textarea rows={2} value={empresa.descricao} onChange={(e) => setE('descricao', e.target.value)} placeholder="Conte um pouco sobre o negócio" />
            </div>
          )}

          {aba === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label>CEP</label>
                  <input value={endereco.cep} onChange={(e) => setEnd('cep', mascaraCep(e.target.value))} onBlur={handleBuscarCep} placeholder="00000-000" autoFocus />
                  {buscandoCep && <div style={{ fontSize: 10.5, color: 'var(--texto2)', marginTop: 4 }}>Buscando endereço…</div>}
                </div>
                <div>
                  <label>Endereço</label>
                  <input value={endereco.endereco} onChange={(e) => setEnd('endereco', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>Número</label>
                  <input value={endereco.numero} onChange={(e) => setEnd('numero', e.target.value)} />
                </div>
                <div>
                  <label>Complemento</label>
                  <input value={endereco.complemento} onChange={(e) => setEnd('complemento', e.target.value)} placeholder="Opcional" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>Bairro</label>
                  <input value={endereco.bairro} onChange={(e) => setEnd('bairro', e.target.value)} />
                </div>
                <div>
                  <label>Cidade</label>
                  <input value={endereco.cidade} onChange={(e) => setEnd('cidade', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>Estado</label>
                  <input value={endereco.estado} onChange={(e) => setEnd('estado', e.target.value.toUpperCase().slice(0, 2))} placeholder="UF" />
                </div>
                <div>
                  <label>País</label>
                  <input value={endereco.pais} onChange={(e) => setEnd('pais', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {aba === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Telefone</label>
                  <input value={contatos.telefone} onChange={(e) => setC('telefone', mascaraTelefone(e.target.value))} autoFocus />
                </div>
                <div>
                  <label>WhatsApp</label>
                  <input value={contatos.whatsapp} onChange={(e) => setC('whatsapp', mascaraTelefone(e.target.value))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>E-mail da empresa</label>
                  <input type="email" value={contatos.email} onChange={(e) => setC('email', e.target.value)} placeholder="contato@empresa.com" />
                </div>
                <div>
                  <label>Site</label>
                  <input value={contatos.site} onChange={(e) => setC('site', e.target.value)} placeholder="Opcional" />
                </div>
              </div>
            </div>
          )}

          {aba === 3 && (
            <div>
              <label>Nome completo *</label>
              <input value={responsavel.nome} onChange={(e) => setR('nome', e.target.value)} autoFocus />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>CPF</label>
                  <input value={responsavel.cpf} onChange={(e) => setR('cpf', mascaraCpf(e.target.value))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label>Telefone</label>
                  <input value={responsavel.telefone} onChange={(e) => setR('telefone', mascaraTelefone(e.target.value))} />
                </div>
              </div>

              <label style={{ marginTop: 12 }}>E-mail (login) *</label>
              <input type="email" value={responsavel.email} onChange={(e) => setR('email', e.target.value)} placeholder="responsavel@email.com" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>Senha *</label>
                  <input type="password" value={responsavel.senha} onChange={(e) => setR('senha', e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                  <label>Confirmar senha *</label>
                  <input type="password" value={responsavel.confirmarSenha} onChange={(e) => setR('confirmarSenha', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {aba === 4 && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--texto2)', marginBottom: 14 }}>Qual plano essa empresa escolheu? Ela entra em trial de 14 dias nesse plano.</p>
              {planos.length === 0 ? (
                <p style={{ color: 'var(--texto2)' }}>Carregando planos…</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {planos.map((p) => (
                    <label key={p.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `1px solid ${planoId === p.id ? 'var(--dourado)' : 'var(--borda)'}`,
                      background: planoId === p.id ? 'rgba(212,175,55,.08)' : 'transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="radio" name="plano" checked={planoId === p.id} onChange={() => setPlanoId(p.id)} style={{ width: 'auto' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nome}</div>
                          {p.descricao && <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>{p.descricao}</div>}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--dourado)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {fmtPreco(p.preco)}/{p.ciclo === 'ANUAL' ? 'ano' : 'mês'}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {erro && <div className="erro-msg">{erro}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {aba > 0 && <button type="button" className="btn-outline" style={{ flex: 1, borderRadius: 10 }} onClick={irParaAnterior}>Voltar</button>}
            {aba < ABAS.length - 1
              ? <button key="btn-proximo" type="button" className="btn" style={{ flex: 1 }} onClick={irParaProxima}>Próximo</button>
              : <button key="btn-concluir" type="submit" className="btn" style={{ flex: 1 }} disabled={enviando}>{enviando ? 'Cadastrando…' : 'Concluir cadastro'}</button>}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
