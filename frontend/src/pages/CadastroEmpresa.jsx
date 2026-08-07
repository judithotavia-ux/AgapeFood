import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as empresaService from '../services/empresaService';
import { mascaraCnpj, mascaraCpf, mascaraCep, mascaraTelefone, TIPO_EMPRESA_LABEL } from '../utils/mascaras';

const ABAS = ['Dados da Empresa', 'Endereço', 'Contatos', 'Responsável'];

const CAMPOS_EMPRESA_INICIAIS = {
  nomeFantasia: '', razaoSocial: '', cnpj: '', inscricaoEstadual: '', inscricaoMunicipal: '',
  dataFundacao: '', tipoEmpresa: 'RESTAURANTE', regimeTributario: '', ramoAtividade: '', descricao: ''
};
const CAMPOS_ENDERECO_INICIAIS = { cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', pais: 'Brasil' };
const CAMPOS_CONTATOS_INICIAIS = { telefone: '', whatsapp: '', email: '', site: '', instagram: '', facebook: '', tiktok: '', youtube: '' };
const CAMPOS_RESPONSAVEL_INICIAIS = { nome: '', cpf: '', rg: '', dataNascimento: '', telefone: '', email: '', senha: '', confirmarSenha: '' };

export default function CadastroEmpresa() {
  const { entrarComToken } = useAuth();
  const navigate = useNavigate();

  const [aba, setAba] = useState(0);
  const [empresa, setEmpresa] = useState(CAMPOS_EMPRESA_INICIAIS);
  const [endereco, setEndereco] = useState(CAMPOS_ENDERECO_INICIAIS);
  const [contatos, setContatos] = useState(CAMPOS_CONTATOS_INICIAIS);
  const [responsavel, setResponsavel] = useState(CAMPOS_RESPONSAVEL_INICIAIS);

  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

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
    const msg = validarAba(3);
    if (msg) return setErro(msg);
    setErro('');
    setEnviando(true);
    try {
      const resposta = await empresaService.registrarEmpresa({ empresa, endereco, contatos, responsavel });
      await entrarComToken(resposta.token);
      navigate('/dashboard');
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível concluir o cadastro.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 16px', background: 'radial-gradient(circle at 50% 0%, #1c1707 0%, #0a0a0a 60%)' }}>
      <div className="card" style={{ maxWidth: 620, margin: '0 auto', padding: 36 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 13, letterSpacing: '.2em', color: 'var(--texto2)', marginBottom: 6 }}>CADASTRE SUA EMPRESA NO</div>
          <h1 style={{ fontSize: 28 }}>AgapeFood</h1>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 26, flexWrap: 'wrap' }}>
          {ABAS.map((nome, i) => (
            <div key={nome} style={{ flex: 1, textAlign: 'center', minWidth: 100 }}>
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
                  <label>Inscrição Estadual</label>
                  <input value={empresa.inscricaoEstadual} onChange={(e) => setE('inscricaoEstadual', e.target.value)} placeholder="Opcional" />
                </div>
                <div>
                  <label>Inscrição Municipal</label>
                  <input value={empresa.inscricaoMunicipal} onChange={(e) => setE('inscricaoMunicipal', e.target.value)} placeholder="Opcional" />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>Regime Tributário</label>
                  <input value={empresa.regimeTributario} onChange={(e) => setE('regimeTributario', e.target.value)} placeholder="Ex: Simples Nacional" />
                </div>
                <div>
                  <label>Ramo de Atividade</label>
                  <input value={empresa.ramoAtividade} onChange={(e) => setE('ramoAtividade', e.target.value)} />
                </div>
              </div>

              <label style={{ marginTop: 12 }}>Descrição</label>
              <textarea rows={2} value={empresa.descricao} onChange={(e) => setE('descricao', e.target.value)} placeholder="Conte um pouco sobre o seu negócio" />
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
                  <input type="email" value={contatos.email} onChange={(e) => setC('email', e.target.value)} placeholder="contato@suaempresa.com" />
                </div>
                <div>
                  <label>Site</label>
                  <input value={contatos.site} onChange={(e) => setC('site', e.target.value)} placeholder="Opcional" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>Instagram</label>
                  <input value={contatos.instagram} onChange={(e) => setC('instagram', e.target.value)} placeholder="@suaempresa" />
                </div>
                <div>
                  <label>Facebook</label>
                  <input value={contatos.facebook} onChange={(e) => setC('facebook', e.target.value)} placeholder="Opcional" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>TikTok</label>
                  <input value={contatos.tiktok} onChange={(e) => setC('tiktok', e.target.value)} placeholder="Opcional" />
                </div>
                <div>
                  <label>YouTube</label>
                  <input value={contatos.youtube} onChange={(e) => setC('youtube', e.target.value)} placeholder="Opcional" />
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
                  <label>RG</label>
                  <input value={responsavel.rg} onChange={(e) => setR('rg', e.target.value)} placeholder="Opcional" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label>Data de Nascimento</label>
                  <input type="date" value={responsavel.dataNascimento} onChange={(e) => setR('dataNascimento', e.target.value)} />
                </div>
                <div>
                  <label>Telefone</label>
                  <input value={responsavel.telefone} onChange={(e) => setR('telefone', mascaraTelefone(e.target.value))} />
                </div>
              </div>

              <label style={{ marginTop: 12 }}>E-mail (login) *</label>
              <input type="email" value={responsavel.email} onChange={(e) => setR('email', e.target.value)} placeholder="seu@email.com" />

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

          {erro && <div className="erro-msg">{erro}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {aba > 0 && <button type="button" className="btn-outline" style={{ flex: 1, borderRadius: 10 }} onClick={irParaAnterior}>Voltar</button>}
            {aba < ABAS.length - 1
              ? <button key="btn-proximo" type="button" className="btn" style={{ flex: 1 }} onClick={irParaProxima}>Próximo</button>
              : <button key="btn-concluir" type="submit" className="btn" style={{ flex: 1 }} disabled={enviando}>{enviando ? 'Cadastrando…' : 'Concluir cadastro'}</button>}
          </div>
        </form>

        <div style={{ textAlign: 'center', fontSize: 12.5, marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--borda)' }}>
          Já tem conta? <Link to="/login" style={{ color: 'var(--dourado)', fontWeight: 600 }}>Entrar</Link>
        </div>
      </div>
    </div>
  );
}
