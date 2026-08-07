import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as deliveryService from '../services/deliveryService';
import { CANAL_LABEL, CANAL_ROTA_WEBHOOK, fmtPreco } from '../utils/pedidoConstantes';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3333/api').replace(/\/api$/, '');

export default function Delivery() {
  const [canais, setCanais] = useState([]);
  const [motoboys, setMotoboys] = useState([]);
  const [ganhos, setGanhos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [modalMotoboy, setModalMotoboy] = useState({ aberto: false, motoboy: null });
  const [nomeM, setNomeM] = useState('');
  const [telefoneM, setTelefoneM] = useState('');
  const [veiculoM, setVeiculoM] = useState('');
  const [erroM, setErroM] = useState('');

  const [modalZona, setModalZona] = useState(false);
  const [bairroZ, setBairroZ] = useState('');
  const [taxaZ, setTaxaZ] = useState('');
  const [tempoZ, setTempoZ] = useState('');
  const [erroZ, setErroZ] = useState('');

  async function carregar() {
    setCarregando(true);
    const [c, m, g, z] = await Promise.all([
      deliveryService.listarCanaisEntrega(),
      deliveryService.listarMotoboys(),
      deliveryService.resumoGanhosMotoboys(),
      deliveryService.listarZonasEntrega()
    ]);
    setCanais(c); setMotoboys(m); setGanhos(g); setZonas(z);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function toggleCanal(canal) {
    await deliveryService.atualizarCanalEntrega(canal.id, !canal.ativo);
    carregar();
  }

  function copiar(texto) {
    navigator.clipboard.writeText(texto);
  }

  function abrirModalMotoboy(motoboy = null) {
    setModalMotoboy({ aberto: true, motoboy });
    setNomeM(motoboy?.nome || ''); setTelefoneM(motoboy?.telefone || ''); setVeiculoM(motoboy?.veiculo || '');
    setErroM('');
  }

  async function handleSalvarMotoboy(e) {
    e.preventDefault();
    if (!nomeM.trim()) return setErroM('Informe o nome.');
    try {
      const dados = { nome: nomeM, telefone: telefoneM || undefined, veiculo: veiculoM || undefined };
      if (modalMotoboy.motoboy) await deliveryService.atualizarMotoboy(modalMotoboy.motoboy.id, dados);
      else await deliveryService.criarMotoboy(dados);
      setModalMotoboy({ aberto: false, motoboy: null });
      await carregar();
    } catch (e) {
      setErroM(e.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function excluirMotoboy(id) {
    if (!confirm('Excluir esse motoboy?')) return;
    await deliveryService.excluirMotoboy(id);
    carregar();
  }

  async function handleSalvarZona(e) {
    e.preventDefault();
    if (!bairroZ.trim()) return setErroZ('Informe o bairro.');
    if (taxaZ === '' || isNaN(Number(taxaZ))) return setErroZ('Informe a taxa (pode ser 0 para grátis).');
    try {
      await deliveryService.criarZonaEntrega({ bairro: bairroZ, taxaEntrega: Number(taxaZ), tempoEstimadoMin: tempoZ || undefined });
      setBairroZ(''); setTaxaZ(''); setTempoZ('');
      setModalZona(false);
      await carregar();
    } catch (e) {
      setErroZ(e.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function excluirZona(id) {
    if (!confirm('Excluir essa zona de entrega?')) return;
    await deliveryService.excluirZonaEntrega(id);
    carregar();
  }

  if (carregando) return <AdminLayout titulo="Delivery"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;

  return (
    <AdminLayout titulo="Delivery">
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Canais de venda</h3>
        <p style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 14 }}>
          Ative os canais que sua empresa usa. iFood, Uber Eats e 99Food ficam prontos pra receber pedidos automaticamente assim que a parceria oficial com cada plataforma for aprovada — é só colar a URL abaixo nas configurações de integração de cada uma.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {canais.map((c) => (
            <div key={c.id} style={{ border: '1px solid var(--borda)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13.5 }}>{CANAL_LABEL[c.tipo]}</strong>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={c.ativo} onChange={() => toggleCanal(c)} style={{ width: 'auto' }} />
                  <span style={{ fontSize: 11, color: c.ativo ? 'var(--sucesso)' : 'var(--texto2)' }}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                </label>
              </div>

              {c.tipo !== 'MOTOBOY_PROPRIO' && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--texto2)', marginBottom: 4 }}>URL do webhook (para configurar na plataforma):</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      readOnly
                      value={`${API_BASE}/api/webhooks/${CANAL_ROTA_WEBHOOK[c.tipo]}/SEU-SLUG?token=${c.webhookToken}`}
                      style={{ fontSize: 10, padding: '6px 8px' }}
                    />
                    <button type="button" className="btn-outline" style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6 }} onClick={() => copiar(`${API_BASE}/api/webhooks/${CANAL_ROTA_WEBHOOK[c.tipo]}/SEU-SLUG?token=${c.webhookToken}`)}>Copiar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15 }}>Motoboys</h3>
          <button className="btn" onClick={() => abrirModalMotoboy()}>+ Motoboy</button>
        </div>
        {!motoboys.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum motoboy cadastrado.</p>}
        {motoboys.map((m) => {
          const g = ganhos.find((x) => x.motoboy.id === m.id);
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--borda)' }}>
              <div>
                <strong style={{ fontSize: 13 }}>{m.nome}</strong>
                {!m.ativo && <span style={{ fontSize: 10.5, color: 'var(--texto2)', marginLeft: 6 }}>(inativo)</span>}
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>{m.telefone || '—'}{m.veiculo ? ` · ${m.veiculo}` : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--texto2)' }}>
                  Hoje: <strong style={{ color: 'var(--dourado)' }}>{fmtPreco(g?.totalGanhosHoje || 0)}</strong> ({g?.totalEntregasHoje || 0} entregas)
                </div>
                <button onClick={() => abrirModalMotoboy(m)} style={{ background: 'none', border: 'none', color: 'var(--dourado)', cursor: 'pointer', fontSize: 12 }}>Editar</button>
                <button onClick={() => excluirMotoboy(m.id)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15 }}>Zonas de entrega (taxa por bairro)</h3>
          <button className="btn" onClick={() => setModalZona(true)}>+ Zona</button>
        </div>
        {!zonas.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma zona cadastrada. As taxas podem ser definidas manualmente em cada pedido.</p>}
        {zonas.map((z) => (
          <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
            <span>{z.bairro}{z.tempoEstimadoMin ? ` · ~${z.tempoEstimadoMin} min` : ''}</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <strong style={{ color: 'var(--dourado)' }}>{Number(z.taxaEntrega) === 0 ? 'Grátis' : fmtPreco(z.taxaEntrega)}</strong>
              <button onClick={() => excluirZona(z.id)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
            </div>
          </div>
        ))}
      </div>

      <Modal titulo={modalMotoboy.motoboy ? 'Editar motoboy' : 'Novo motoboy'} aberto={modalMotoboy.aberto} onFechar={() => setModalMotoboy({ aberto: false, motoboy: null })} largura={360}>
        <form onSubmit={handleSalvarMotoboy}>
          <label>Nome</label>
          <input value={nomeM} onChange={(e) => setNomeM(e.target.value)} autoFocus />
          <label style={{ marginTop: 12 }}>Telefone</label>
          <input value={telefoneM} onChange={(e) => setTelefoneM(e.target.value)} placeholder="Opcional" />
          <label style={{ marginTop: 12 }}>Veículo</label>
          <input value={veiculoM} onChange={(e) => setVeiculoM(e.target.value)} placeholder="Ex: Moto Honda CG" />
          {erroM && <div className="erro-msg">{erroM}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar</button>
        </form>
      </Modal>

      <Modal titulo="Nova zona de entrega" aberto={modalZona} onFechar={() => setModalZona(false)} largura={360}>
        <form onSubmit={handleSalvarZona}>
          <label>Bairro</label>
          <input value={bairroZ} onChange={(e) => setBairroZ(e.target.value)} autoFocus />
          <label style={{ marginTop: 12 }}>Taxa de entrega (R$, 0 = grátis)</label>
          <input type="number" step="0.01" min="0" value={taxaZ} onChange={(e) => setTaxaZ(e.target.value)} />
          <label style={{ marginTop: 12 }}>Tempo estimado (minutos)</label>
          <input type="number" min="0" value={tempoZ} onChange={(e) => setTempoZ(e.target.value)} placeholder="Opcional" />
          {erroZ && <div className="erro-msg">{erroZ}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar zona</button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
