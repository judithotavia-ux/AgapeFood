import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import PreVisualizacaoImpressao from '../components/PreVisualizacaoImpressao';
import * as impressaoService from '../services/impressaoService';
import {
  SETOR_LABEL, SETOR_ICONE, CONEXAO_LABEL, STATUS_IMPRESSORA_LABEL, STATUS_IMPRESSORA_COR, STATUS_IMPRESSORA_ICONE
} from '../utils/impressaoConstantes';

export default function Impressoras() {
  const [impressoras, setImpressoras] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setor, setSetor] = useState('COZINHA');
  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipoConexao, setTipoConexao] = useState('USB');
  const [identificadorLocal, setIdentificadorLocal] = useState('');
  const [larguraPapelMm, setLarguraPapelMm] = useState('80');
  const [caracteresPorLinha, setCaracteresPorLinha] = useState('48');
  const [copias, setCopias] = useState('1');
  const [padrao, setPadrao] = useState(false);
  const [erro, setErro] = useState('');

  const [testando, setTestando] = useState(null);
  const [avisoTeste, setAvisoTeste] = useState('');

  const [previa, setPrevia] = useState(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(null);

  async function carregar() {
    setCarregando(true);
    const lista = await impressaoService.listarImpressoras();
    setImpressoras(lista);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirModal(impressora) {
    setEditando(impressora || null);
    setNome(impressora?.nome || '');
    setDescricao(impressora?.descricao || '');
    setSetor(impressora?.setor || 'COZINHA');
    setFabricante(impressora?.fabricante || '');
    setModelo(impressora?.modelo || '');
    setTipoConexao(impressora?.tipoConexao || 'USB');
    setIdentificadorLocal(impressora?.identificadorLocal || '');
    setLarguraPapelMm(impressora ? String(impressora.larguraPapelMm) : '80');
    setCaracteresPorLinha(impressora ? String(impressora.caracteresPorLinha) : '48');
    setCopias(impressora ? String(impressora.copias) : '1');
    setPadrao(impressora?.padrao || false);
    setErro('');
    setModalAberto(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!nome.trim()) return setErro('Informe o nome da impressora.');
    const dados = {
      nome, descricao: descricao || undefined, setor, fabricante: fabricante || undefined, modelo: modelo || undefined,
      tipoConexao, identificadorLocal: identificadorLocal || undefined,
      larguraPapelMm: Number(larguraPapelMm), caracteresPorLinha: Number(caracteresPorLinha), copias: Number(copias), padrao
    };
    try {
      if (editando) await impressaoService.atualizarImpressora(editando.id, dados);
      else await impressaoService.criarImpressora(dados);
      setModalAberto(false);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function handleAtivar(impressora) {
    await impressaoService.atualizarImpressora(impressora.id, { ativa: !impressora.ativa });
    carregar();
  }

  async function handleDefinirPadrao(impressora) {
    await impressaoService.atualizarImpressora(impressora.id, { padrao: true });
    carregar();
  }

  async function handleExcluir(impressora) {
    if (!confirm(`Excluir a impressora "${impressora.nome}"?`)) return;
    try {
      await impressaoService.excluirImpressora(impressora.id);
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Não foi possível excluir.');
    }
  }

  async function handleVisualizar(impressora) {
    setCarregandoPrevia(impressora.id);
    try {
      const dados = await impressaoService.preVisualizarImpressora(impressora.id);
      setPrevia({ nome: impressora.nome, ...dados });
    } catch (err) {
      alert(err.response?.data?.erro || 'Não foi possível gerar a pré-visualização.');
    } finally {
      setCarregandoPrevia(null);
    }
  }

  async function handleTestar(impressora) {
    setTestando(impressora.id);
    setAvisoTeste('');
    try {
      await impressaoService.testarImpressora(impressora.id);
      setAvisoTeste(`Job de teste enviado para "${impressora.nome}". Se o agente de impressão local estiver conectado, a página de teste sairá na impressora em instantes.`);
    } catch (err) {
      setAvisoTeste(err.response?.data?.erro || 'Não foi possível criar o job de teste.');
    } finally {
      setTestando(null);
      setTimeout(() => setAvisoTeste(''), 6000);
    }
  }

  if (carregando) return <AdminLayout titulo="Impressoras"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;

  return (
    <AdminLayout titulo="Impressoras">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 12.5, color: 'var(--texto2)', maxWidth: 560 }}>
          Cadastre as impressoras térmicas do seu estabelecimento. A impressão de verdade é feita pelo Agente de Impressão AgapeFood,
          um pequeno programa que você instala no computador conectado às impressoras.
        </p>
        <button className="btn" onClick={() => abrirModal(null)}>+ Impressora</button>
      </div>

      {avisoTeste && <div className="card" style={{ marginBottom: 14, fontSize: 12.5, borderColor: 'var(--dourado)' }}>{avisoTeste}</div>}

      {!impressoras.length && <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)' }}>Nenhuma impressora cadastrada ainda.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {impressoras.map((imp) => (
          <div key={imp.id} className="card" style={{ opacity: imp.ativa ? 1 : 0.55 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{SETOR_ICONE[imp.setor]} {imp.nome} {imp.padrao && <span title="Impressora padrão" style={{ fontSize: 11 }}>⭐</span>}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)', marginTop: 2 }}>{SETOR_LABEL[imp.setor]} · {CONEXAO_LABEL[imp.tipoConexao]}</div>
              </div>
              <span style={{ fontSize: 12, color: STATUS_IMPRESSORA_COR[imp.status] }}>{STATUS_IMPRESSORA_ICONE[imp.status]} {STATUS_IMPRESSORA_LABEL[imp.status]}</span>
            </div>

            {imp.identificadorLocal && <div style={{ fontSize: 11, color: 'var(--texto2)', marginBottom: 4 }}>Endereço local: {imp.identificadorLocal}</div>}
            {imp.ultimaImpressaoEm && <div style={{ fontSize: 11, color: 'var(--texto2)' }}>Última impressão: {new Date(imp.ultimaImpressaoEm).toLocaleString('pt-BR')}</div>}
            {imp.ultimoErro && <div style={{ fontSize: 11, color: 'var(--erro)', marginTop: 4 }}>⚠ {imp.ultimoErro}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn-outline" style={{ fontSize: 11.5, padding: '6px 10px' }} onClick={() => handleVisualizar(imp)} disabled={carregandoPrevia === imp.id}>
                {carregandoPrevia === imp.id ? 'Carregando…' : '👁️ Visualizar'}
              </button>
              <button className="btn-outline" style={{ fontSize: 11.5, padding: '6px 10px' }} onClick={() => handleTestar(imp)} disabled={testando === imp.id}>
                {testando === imp.id ? 'Enviando…' : '🖨️ Testar impressão'}
              </button>
              <button style={{ background: 'none', border: 'none', color: 'var(--texto2)', fontSize: 11.5, cursor: 'pointer' }} onClick={() => abrirModal(imp)}>Editar</button>
              {!imp.padrao && <button style={{ background: 'none', border: 'none', color: 'var(--dourado)', fontSize: 11.5, cursor: 'pointer' }} onClick={() => handleDefinirPadrao(imp)}>Tornar padrão</button>}
              <button style={{ background: 'none', border: 'none', color: 'var(--texto2)', fontSize: 11.5, cursor: 'pointer' }} onClick={() => handleAtivar(imp)}>{imp.ativa ? 'Desativar' : 'Ativar'}</button>
              <button style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 11.5, cursor: 'pointer' }} onClick={() => handleExcluir(imp)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>

      <Modal titulo={previa ? `Pré-visualização — ${previa.nome}` : ''} aberto={!!previa} onFechar={() => setPrevia(null)} largura={380}>
        {previa && (
          <>
            <p style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 4 }}>
              É assim que vai sair no papel — sem precisar do Agente de Impressão ligado.
            </p>
            <PreVisualizacaoImpressao documento={previa.documento} larguraPapelMm={previa.larguraPapelMm} />
          </>
        )}
      </Modal>

      <Modal titulo={editando ? 'Editar impressora' : 'Nova impressora'} aberto={modalAberto} onFechar={() => setModalAberto(false)} largura={480}>
        <form onSubmit={handleSalvar}>
          <label>Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus placeholder="Ex: Impressora da Cozinha" />
          <label style={{ marginTop: 12 }}>Descrição</label>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Setor</label>
              <select value={setor} onChange={(e) => setSetor(e.target.value)}>
                {Object.entries(SETOR_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label>Tipo de conexão</label>
              <select value={tipoConexao} onChange={(e) => setTipoConexao(e.target.value)}>
                {Object.entries(CONEXAO_LABEL).map(([v, l]) => <option key={v} value={v} disabled={v === 'BLUETOOTH'}>{l}</option>)}
              </select>
            </div>
          </div>

          <label style={{ marginTop: 12 }}>{tipoConexao === 'REDE' ? 'Endereço de rede (IP:porta)' : 'Identificador USB'}</label>
          <input value={identificadorLocal} onChange={(e) => setIdentificadorLocal(e.target.value)} placeholder={tipoConexao === 'REDE' ? 'Ex: 192.168.0.50:9100' : 'Ex: USB001'} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div><label>Fabricante</label><input value={fabricante} onChange={(e) => setFabricante(e.target.value)} placeholder="Opcional" /></div>
            <div><label>Modelo</label><input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Opcional" /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <div><label>Largura do papel (mm)</label><input type="number" value={larguraPapelMm} onChange={(e) => setLarguraPapelMm(e.target.value)} /></div>
            <div><label>Caracteres/linha</label><input type="number" value={caracteresPorLinha} onChange={(e) => setCaracteresPorLinha(e.target.value)} /></div>
            <div><label>Cópias</label><input type="number" min="1" value={copias} onChange={(e) => setCopias(e.target.value)} /></div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, textTransform: 'none', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} style={{ width: 'auto' }} /> Definir como impressora padrão
          </label>

          {erro && <div className="erro-msg">{erro}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar</button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
