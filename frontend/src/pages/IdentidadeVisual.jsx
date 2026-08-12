import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import * as empresaService from '../services/empresaService';

const TEMA_LABEL = { CLARO: 'Claro', ESCURO: 'Escuro', AUTOMATICO: 'Automático (segue o dispositivo)' };

function CampoLogo({ rotulo, url, onEscolher, onRemover, tamanho = 88 }) {
  const [preview, setPreview] = useState(url);
  useEffect(() => setPreview(url), [url]);

  function handleArquivo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setPreview(URL.createObjectURL(arquivo));
    onEscolher(arquivo);
  }

  function remover() {
    setPreview(null);
    onRemover();
  }

  return (
    <div style={{ flexShrink: 0, width: tamanho }}>
      <div style={{
        width: tamanho, height: tamanho, borderRadius: 10, background: 'var(--preto3)',
        border: '1px dashed var(--borda)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
      }}>
        {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 22 }}>🖼️</span>}
      </div>
      <label className="btn-outline" style={{ display: 'block', textAlign: 'center', marginTop: 6, fontSize: 10.5, padding: '5px 4px', cursor: 'pointer', borderRadius: 8 }}>
        {rotulo}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleArquivo} style={{ display: 'none' }} />
      </label>
      {preview && (
        <button type="button" onClick={remover} style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 10.5, marginTop: 2, cursor: 'pointer', width: '100%' }}>
          Remover
        </button>
      )}
    </div>
  );
}

function CampoCor({ rotulo, valor, onChange }) {
  return (
    <div>
      <label>{rotulo}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="color" value={valor || '#000000'} onChange={(e) => onChange(e.target.value)} style={{ width: 40, height: 36, padding: 2, cursor: 'pointer' }} />
        <input type="text" value={valor || ''} onChange={(e) => onChange(e.target.value)} placeholder="#D4AF37" style={{ flex: 1 }} />
      </div>
    </div>
  );
}

export default function IdentidadeVisual() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [logosSeparados, setLogosSeparados] = useState(false);

  const [arquivos, setArquivos] = useState({});
  const [remocoes, setRemocoes] = useState({});

  async function carregar() {
    setCarregando(true);
    const dadosCarregados = await empresaService.obterIdentidadeVisual();
    setDados(dadosCarregados);
    setLogosSeparados(!!(dadosCarregados.logoImpressaoUrl || dadosCarregados.logoCardapioUrl || dadosCarregados.logoReciboUrl));
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function set(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  function escolherLogo(campo) {
    return (arquivo) => {
      setArquivos((a) => ({ ...a, [campo]: arquivo }));
      setRemocoes((r) => ({ ...r, [campo]: false }));
    };
  }

  function removerLogo(campo, campoUrl) {
    return () => {
      setArquivos((a) => ({ ...a, [campo]: null }));
      setRemocoes((r) => ({ ...r, [campo]: true }));
      set(campoUrl, null);
    };
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true); setErro(''); setMensagem('');

    const formData = new FormData();
    formData.append('slogan', dados.slogan || '');
    formData.append('corPrimaria', dados.corPrimaria || '');
    formData.append('corSecundaria', dados.corSecundaria || '');
    formData.append('corDestaque', dados.corDestaque || '');
    formData.append('corTexto', dados.corTexto || '');
    formData.append('tema', dados.tema || 'AUTOMATICO');
    formData.append('exibirMarcaAgapeFood', String(dados.exibirMarcaAgapeFood !== false));
    formData.append('exibirLogoCardapio', String(dados.exibirLogoCardapio !== false));
    formData.append('exibirSloganCardapio', String(dados.exibirSloganCardapio !== false));
    formData.append('exibirSloganComanda', String(dados.exibirSloganComanda !== false));
    formData.append('mensagemAgradecimento', dados.mensagemAgradecimento || '');
    formData.append('rodapeComanda', dados.rodapeComanda || '');
    formData.append('whatsapp', dados.whatsapp || '');
    formData.append('telefone', dados.telefone || '');
    formData.append('emailContato', dados.emailContato || '');
    formData.append('site', dados.site || '');
    formData.append('instagram', dados.instagram || '');
    formData.append('facebook', dados.facebook || '');
    formData.append('tiktok', dados.tiktok || '');
    formData.append('youtube', dados.youtube || '');

    const mapa = { logo: null, logoImpressao: 'logoImpressaoUrl', logoCardapio: 'logoCardapioUrl', logoRecibo: 'logoReciboUrl' };
    for (const campo of Object.keys(mapa)) {
      if (arquivos[campo]) formData.append(campo, arquivos[campo]);
      if (remocoes[campo]) formData.append(`remover_${campo}`, 'true');
    }

    try {
      const atualizado = await empresaService.atualizarIdentidadeVisual(formData);
      setDados(atualizado);
      setArquivos({}); setRemocoes({});
      setMensagem('Identidade visual salva com sucesso.');
    } catch (e) {
      setErro(e.response?.data?.erro || 'Não foi possível salvar. Verifique os campos e tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando || !dados) {
    return <AdminLayout titulo="Identidade Visual"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;
  }

  return (
    <AdminLayout titulo="Identidade Visual">
      <p style={{ color: 'var(--texto2)', fontSize: 13.5, marginBottom: 22 }}>Logo, cores e slogan da sua empresa — usados no cardápio, comanda, cupom e nos painéis internos.</p>

      <form onSubmit={salvar} style={{ display: 'grid', gap: 20, maxWidth: 640 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Logo</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <CampoLogo rotulo="Logo principal" url={dados.logoUrl} onEscolher={escolherLogo('logo')} onRemover={removerLogo('logo', 'logoUrl')} tamanho={110} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, cursor: 'pointer', fontSize: 12.5 }}>
            <input type="checkbox" checked={logosSeparados} onChange={(e) => setLogosSeparados(e.target.checked)} />
            Usar logos diferentes para impressão, cardápio e recibo
          </label>
          {logosSeparados && (
            <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
              <CampoLogo rotulo="Impressão" url={dados.logoImpressaoUrl} onEscolher={escolherLogo('logoImpressao')} onRemover={removerLogo('logoImpressao', 'logoImpressaoUrl')} />
              <CampoLogo rotulo="Cardápio" url={dados.logoCardapioUrl} onEscolher={escolherLogo('logoCardapio')} onRemover={removerLogo('logoCardapio', 'logoCardapioUrl')} />
              <CampoLogo rotulo="Recibo" url={dados.logoReciboUrl} onEscolher={escolherLogo('logoRecibo')} onRemover={removerLogo('logoRecibo', 'logoReciboUrl')} />
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Slogan</h3>
          <input type="text" value={dados.slogan || ''} onChange={(e) => set('slogan', e.target.value)} placeholder='Ex: "Seu sabor, seu momento."' maxLength={120} />
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Cores</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <CampoCor rotulo="Cor primária" valor={dados.corPrimaria} onChange={(v) => set('corPrimaria', v)} />
            <CampoCor rotulo="Cor secundária" valor={dados.corSecundaria} onChange={(v) => set('corSecundaria', v)} />
            <CampoCor rotulo="Cor de destaque" valor={dados.corDestaque} onChange={(v) => set('corDestaque', v)} />
            <CampoCor rotulo="Cor do texto" valor={dados.corTexto} onChange={(v) => set('corTexto', v)} />
          </div>

          <div style={{ marginTop: 18 }}>
            <label>Tema</label>
            <select value={dados.tema} onChange={(e) => set('tema', e.target.value)}>
              {Object.entries(TEMA_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div style={{
            marginTop: 18, padding: 16, borderRadius: 10, border: '1px solid var(--borda)',
            background: dados.corPrimaria || '#111', color: dados.corTexto || '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {dados.logoUrl && <img src={dados.logoUrl} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />}
              <strong>Pré-visualização</strong>
            </div>
            {dados.slogan && <div style={{ fontSize: 12, marginTop: 6, opacity: .9 }}>{dados.slogan}</div>}
            <button type="button" style={{ marginTop: 10, background: dados.corDestaque || dados.corSecundaria || '#000', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12 }}>
              Botão de exemplo
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Contato e redes sociais</h3>
          <p style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 14 }}>Aparecem no rodapé do cardápio digital. O WhatsApp também é usado pro cliente chamar o restaurante direto.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div>
              <label>WhatsApp</label>
              <input type="text" value={dados.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="(92) 99999-9999" />
            </div>
            <div>
              <label>Telefone</label>
              <input type="text" value={dados.telefone || ''} onChange={(e) => set('telefone', e.target.value)} placeholder="(92) 99999-9999" />
            </div>
            <div>
              <label>E-mail de contato</label>
              <input type="email" value={dados.emailContato || ''} onChange={(e) => set('emailContato', e.target.value)} placeholder="contato@seurestaurante.com" />
            </div>
            <div>
              <label>Site</label>
              <input type="text" value={dados.site || ''} onChange={(e) => set('site', e.target.value)} placeholder="https://seurestaurante.com" />
            </div>
            <div>
              <label>Instagram</label>
              <input type="text" value={dados.instagram || ''} onChange={(e) => set('instagram', e.target.value)} placeholder="https://instagram.com/seurestaurante" />
            </div>
            <div>
              <label>Facebook</label>
              <input type="text" value={dados.facebook || ''} onChange={(e) => set('facebook', e.target.value)} placeholder="https://facebook.com/seurestaurante" />
            </div>
            <div>
              <label>TikTok</label>
              <input type="text" value={dados.tiktok || ''} onChange={(e) => set('tiktok', e.target.value)} placeholder="https://tiktok.com/@seurestaurante" />
            </div>
            <div>
              <label>YouTube</label>
              <input type="text" value={dados.youtube || ''} onChange={(e) => set('youtube', e.target.value)} placeholder="https://youtube.com/@seurestaurante" />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Onde exibir</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={dados.exibirLogoCardapio !== false} onChange={(e) => set('exibirLogoCardapio', e.target.checked)} />
              Logo no cardápio digital
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={dados.exibirSloganCardapio !== false} onChange={(e) => set('exibirSloganCardapio', e.target.checked)} />
              Slogan no cardápio digital
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={dados.exibirSloganComanda !== false} onChange={(e) => set('exibirSloganComanda', e.target.checked)} />
              Slogan na comanda impressa (a impressora térmica não imprime o logo, só texto)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={dados.exibirMarcaAgapeFood !== false} onChange={(e) => set('exibirMarcaAgapeFood', e.target.checked)} />
              Exibir "Powered by Ágape Food" no cardápio digital
            </label>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Mensagens da comanda</h3>
          <label>Mensagem de agradecimento</label>
          <input type="text" value={dados.mensagemAgradecimento || ''} onChange={(e) => set('mensagemAgradecimento', e.target.value)} placeholder="Ex: Obrigado pela preferência!" style={{ marginBottom: 12 }} />
          <label>Rodapé adicional (opcional)</label>
          <input type="text" value={dados.rodapeComanda || ''} onChange={(e) => set('rodapeComanda', e.target.value)} placeholder="Ex: Siga @suaempresa no Instagram" />
        </div>

        {erro && <div className="erro-msg">{erro}</div>}
        {mensagem && <div style={{ color: 'var(--sucesso)', fontSize: 13 }}>✓ {mensagem}</div>}
        <button type="submit" className="btn" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar identidade visual'}</button>
      </form>
    </AdminLayout>
  );
}
