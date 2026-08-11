import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import * as empresaService from '../services/empresaService';

function fmtCnpj(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export default function DadosFiscais() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    empresaService.obterDadosFiscais().then(setDados).finally(() => setCarregando(false));
  }, []);

  function set(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true); setErro(''); setMensagem('');
    try {
      const atualizado = await empresaService.atualizarDadosFiscais(dados);
      setDados(atualizado);
      setMensagem('Dados fiscais salvos com sucesso.');
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível salvar. Verifique os campos e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando || !dados) {
    return <AdminLayout titulo="Dados Fiscais"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;
  }

  return (
    <AdminLayout titulo="Dados Fiscais">
      <p style={{ color: 'var(--texto2)', fontSize: 13.5, marginBottom: 10 }}>Dados usados nos documentos da empresa e preparados para uma futura emissão fiscal.</p>
      <div className="card" style={{ borderColor: 'var(--dourado)', marginBottom: 22, maxWidth: 640, fontSize: 12.5, color: 'var(--texto2)' }}>
        ⚠️ O AgapeFood ainda não emite NFC-e, NF-e ou qualquer documento fiscal eletrônico. Esses dados ficam prontos para quando essa integração existir — a impressão de comanda/pedido não é, e não substitui, um documento fiscal.
      </div>

      <form onSubmit={salvar} style={{ display: 'grid', gap: 20, maxWidth: 640 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Identificação</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
            <div>
              <label>Razão social</label>
              <input type="text" value={dados.razaoSocial || ''} onChange={(e) => set('razaoSocial', e.target.value)} />
            </div>
            <div>
              <label>CNPJ</label>
              <input type="text" value={fmtCnpj(dados.cnpj)} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
            <div>
              <label>Inscrição estadual</label>
              <input type="text" value={dados.inscricaoEstadual || ''} onChange={(e) => set('inscricaoEstadual', e.target.value)} />
            </div>
            <div>
              <label>Inscrição municipal</label>
              <input type="text" value={dados.inscricaoMunicipal || ''} onChange={(e) => set('inscricaoMunicipal', e.target.value)} />
            </div>
          </div>
          <label>Regime tributário</label>
          <input type="text" value={dados.regimeTributario || ''} onChange={(e) => set('regimeTributario', e.target.value)} placeholder="Ex: Simples Nacional" />
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Endereço fiscal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 12 }}>
            <div>
              <label>CEP</label>
              <input type="text" value={dados.cep || ''} onChange={(e) => set('cep', e.target.value)} />
            </div>
            <div>
              <label>Endereço</label>
              <input type="text" value={dados.endereco || ''} onChange={(e) => set('endereco', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 12 }}>
            <div>
              <label>Número</label>
              <input type="text" value={dados.numero || ''} onChange={(e) => set('numero', e.target.value)} />
            </div>
            <div>
              <label>Complemento</label>
              <input type="text" value={dados.complemento || ''} onChange={(e) => set('complemento', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label>Bairro</label>
              <input type="text" value={dados.bairro || ''} onChange={(e) => set('bairro', e.target.value)} />
            </div>
            <div>
              <label>Cidade</label>
              <input type="text" value={dados.cidade || ''} onChange={(e) => set('cidade', e.target.value)} />
            </div>
            <div>
              <label>Estado</label>
              <input type="text" value={dados.estado || ''} onChange={(e) => set('estado', e.target.value)} maxLength={2} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Ambiente fiscal</h3>
          <p style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 10 }}>Sem efeito ainda — fica registrado para quando a emissão fiscal real for implementada.</p>
          <select value={dados.ambienteFiscal} onChange={(e) => set('ambienteFiscal', e.target.value)}>
            <option value="HOMOLOGACAO">Homologação</option>
            <option value="PRODUCAO">Produção</option>
          </select>
        </div>

        {erro && <div className="erro-msg">{erro}</div>}
        {mensagem && <div style={{ color: 'var(--sucesso)', fontSize: 13 }}>✓ {mensagem}</div>}
        <button type="submit" className="btn" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar dados fiscais'}</button>
      </form>
    </AdminLayout>
  );
}
