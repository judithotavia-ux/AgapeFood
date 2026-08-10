import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as marketingService from '../services/marketingService';
import {
  CANAL_LABEL, CANAL_ICONE, STATUS_CAMPANHA_LABEL, SEGMENTO_CLIENTE_LABEL, fmtPrecoMkt, fmtDataMkt
} from '../utils/marketingConstantes';

const ABAS = ['Visão geral', 'Clientes', 'Cupons', 'Campanhas', 'Avaliações'];
const SEGMENTOS = ['TODOS', 'ATIVOS', 'INATIVOS', 'VIP', 'ANIVERSARIANTES'];

function CartaoStat({ label, valor, icone, cor }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 24 }}>{icone}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: cor || 'var(--dourado)' }}>{valor}</div>
        <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function Marketing() {
  const [aba, setAba] = useState(0);
  const [resumo, setResumo] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [segmento, setSegmento] = useState('TODOS');
  const [cupons, setCupons] = useState([]);
  const [campanhas, setCampanhas] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [cashbackAtual, setCashbackAtual] = useState(0);
  const [cashbackInput, setCashbackInput] = useState('0');
  const [salvandoCashback, setSalvandoCashback] = useState(false);
  const [avisoCashback, setAvisoCashback] = useState('');

  const [modalCupom, setModalCupom] = useState(false);
  const [codigoCupom, setCodigoCupom] = useState('');
  const [tipoDescCupom, setTipoDescCupom] = useState('PERCENTUAL');
  const [valorCupom, setValorCupom] = useState('');
  const [usoMaxCupom, setUsoMaxCupom] = useState('');
  const [validoAteCupom, setValidoAteCupom] = useState('');
  const [erroCupom, setErroCupom] = useState('');

  const [modalCampanha, setModalCampanha] = useState(false);
  const [campanhaEditando, setCampanhaEditando] = useState(null);
  const [nomeCamp, setNomeCamp] = useState('');
  const [canalCamp, setCanalCamp] = useState('WHATSAPP');
  const [segmentoCamp, setSegmentoCamp] = useState('');
  const [cupomIdCamp, setCupomIdCamp] = useState('');
  const [custoCamp, setCustoCamp] = useState('');
  const [objetivoCamp, setObjetivoCamp] = useState('');
  const [tomCamp, setTomCamp] = useState('');
  const [textoCamp, setTextoCamp] = useState('');
  const [statusCamp, setStatusCamp] = useState('RASCUNHO');
  const [gerandoIA, setGerandoIA] = useState(false);
  const [erroIA, setErroIA] = useState('');
  const [erroCamp, setErroCamp] = useState('');

  async function carregar() {
    setCarregando(true);
    const [r, cl, cu, ca, av, emp] = await Promise.all([
      marketingService.obterResumoMarketing(),
      marketingService.listarClientes(),
      marketingService.listarCupons(),
      marketingService.listarCampanhas(),
      marketingService.listarAvaliacoes(),
      marketingService.obterMinhaEmpresa()
    ]);
    setResumo(r); setClientes(cl); setCupons(cu); setCampanhas(ca); setAvaliacoes(av);
    setCashbackAtual(Number(emp.percentualCashback));
    setCashbackInput(String(Number(emp.percentualCashback)));
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (aba === 1) marketingService.listarClientes(segmento === 'TODOS' ? undefined : segmento).then(setClientes);
  }, [aba, segmento]);

  function abrirModalCupom() {
    setCodigoCupom(''); setTipoDescCupom('PERCENTUAL'); setValorCupom(''); setUsoMaxCupom(''); setValidoAteCupom(''); setErroCupom('');
    setModalCupom(true);
  }

  async function handleSalvarCupom(e) {
    e.preventDefault();
    if (!codigoCupom.trim()) return setErroCupom('Informe o código do cupom.');
    if (!valorCupom || isNaN(Number(valorCupom)) || Number(valorCupom) <= 0) return setErroCupom('Informe um valor válido.');
    try {
      await marketingService.criarCupom({
        codigo: codigoCupom, tipoDesconto: tipoDescCupom, valor: Number(valorCupom),
        usoMaximo: usoMaxCupom || undefined, validoAte: validoAteCupom || undefined
      });
      setModalCupom(false);
      await carregar();
    } catch (err) {
      setErroCupom(err.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function alternarAtivoCupom(cupom) {
    await marketingService.atualizarCupom(cupom.id, { ativo: !cupom.ativo });
    carregar();
  }

  async function excluirCupomItem(cupom) {
    if (!confirm('Excluir esse cupom?')) return;
    await marketingService.excluirCupom(cupom.id);
    carregar();
  }

  function abrirModalCampanha(campanha) {
    setCampanhaEditando(campanha || null);
    setNomeCamp(campanha?.nome || '');
    setCanalCamp(campanha?.canal || 'WHATSAPP');
    setSegmentoCamp(campanha?.segmento || '');
    setCupomIdCamp(campanha?.cupomId || '');
    setCustoCamp(campanha?.custo != null ? String(campanha.custo) : '');
    setObjetivoCamp('');
    setTomCamp('');
    setTextoCamp(campanha?.texto || '');
    setStatusCamp(campanha?.status || 'RASCUNHO');
    setErroIA(''); setErroCamp('');
    setModalCampanha(true);
  }

  async function handleGerarIA() {
    setErroIA('');
    if (!objetivoCamp.trim()) return setErroIA('Descreva o objetivo da campanha para a IA gerar o texto.');
    setGerandoIA(true);
    try {
      const { texto } = await marketingService.gerarTextoIA({
        canal: canalCamp, objetivo: objetivoCamp, segmento: segmentoCamp, tom: tomCamp
      });
      setTextoCamp(texto);
    } catch (err) {
      setErroIA(err.response?.data?.erro || 'Não foi possível gerar o texto agora.');
    } finally {
      setGerandoIA(false);
    }
  }

  async function handleSalvarCampanha(e) {
    e.preventDefault();
    if (!nomeCamp.trim()) return setErroCamp('Informe o nome da campanha.');
    if (!segmentoCamp.trim()) return setErroCamp('Informe o público-alvo.');
    try {
      const dados = {
        nome: nomeCamp, canal: canalCamp, segmento: segmentoCamp, texto: textoCamp || undefined,
        cupomId: cupomIdCamp || undefined, custo: custoCamp || undefined
      };
      if (campanhaEditando) {
        await marketingService.atualizarCampanha(campanhaEditando.id, { ...dados, status: statusCamp });
      } else {
        await marketingService.criarCampanha(dados);
      }
      setModalCampanha(false);
      await carregar();
    } catch (err) {
      setErroCamp(err.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function excluirCampanhaItem(campanha) {
    if (!confirm('Excluir essa campanha?')) return;
    await marketingService.excluirCampanha(campanha.id);
    carregar();
  }

  async function handleSalvarCashback(e) {
    e.preventDefault();
    setAvisoCashback('');
    setSalvandoCashback(true);
    try {
      const atualizado = await marketingService.atualizarCashback(Number(cashbackInput));
      setCashbackAtual(Number(atualizado.percentualCashback));
      setAvisoCashback('Configuração salva!');
      setTimeout(() => setAvisoCashback(''), 3000);
    } catch (err) {
      setAvisoCashback(err.response?.data?.erro || 'Não foi possível salvar.');
    } finally {
      setSalvandoCashback(false);
    }
  }

  if (carregando || !resumo) return <AdminLayout titulo="Marketing"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;

  return (
    <AdminLayout titulo="Marketing">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
        <CartaoStat label="Clientes ativos" valor={resumo.clientesAtivos} icone="🟢" cor="var(--sucesso)" />
        <CartaoStat label="Clientes inativos" valor={resumo.clientesInativos} icone="🔴" cor="var(--erro)" />
        <CartaoStat label="Total de clientes" valor={resumo.totalClientes} icone="👥" />
        <CartaoStat label="Aniversariantes do mês" valor={resumo.aniversariantesDoMes} icone="🎂" />
        <CartaoStat label="Conversão de campanhas" valor={`${resumo.conversao.toFixed(1)}%`} icone="🎯" />
        <CartaoStat label="Faturamento via campanhas" valor={fmtPrecoMkt(resumo.faturamentoCampanhas)} icone="💰" cor="var(--sucesso)" />
        <CartaoStat label="Cupons ativos" valor={`${resumo.cupons.ativos} / ${resumo.cupons.total}`} icone="🎟️" />
        <CartaoStat label="Usos de cupons" valor={resumo.cupons.totalUsos} icone="🔁" />
        <CartaoStat label="Cashback distribuído" valor={fmtPrecoMkt(resumo.cashbackDistribuido)} icone="🪙" />
        <CartaoStat label="Avaliação média" valor={resumo.avaliacoes.notaMedia ? `⭐ ${resumo.avaliacoes.notaMedia.toFixed(1)} (${resumo.avaliacoes.total})` : 'Sem avaliações'} icone="⭐" />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--borda)', overflowX: 'auto' }}>
        {ABAS.map((a, i) => (
          <button
            key={a}
            onClick={() => setAba(i)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: 13, whiteSpace: 'nowrap',
              color: aba === i ? 'var(--dourado)' : 'var(--texto2)',
              borderBottom: aba === i ? '2px solid var(--dourado)' : '2px solid transparent'
            }}
          >
            {a}
          </button>
        ))}
      </div>

      {aba === 0 && (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>🪙 Programa de cashback</h3>
            <p style={{ fontSize: 11.5, color: 'var(--texto2)', marginBottom: 12 }}>
              Percentual do valor do pedido devolvido como cashback ao cliente quando o pedido é marcado como entregue. Cashback atual: {cashbackAtual}%.
            </p>
            <form onSubmit={handleSalvarCashback} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div>
                <label>Percentual de cashback (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={cashbackInput} onChange={(e) => setCashbackInput(e.target.value)} style={{ width: 120 }} />
              </div>
              <button type="submit" className="btn" disabled={salvandoCashback}>{salvandoCashback ? 'Salvando…' : 'Salvar'}</button>
              {avisoCashback && <span style={{ fontSize: 12, color: 'var(--texto2)' }}>{avisoCashback}</span>}
            </form>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Campanhas — desempenho</h3>
          {!resumo.campanhas.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma campanha criada ainda.</p>}
          {resumo.campanhas.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div>
                <strong>{CANAL_ICONE[c.canal]} {c.nome}</strong>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{STATUS_CAMPANHA_LABEL[c.status]} · {c.conversoes} conversões</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{fmtPrecoMkt(c.faturamentoAtribuido)}</div>
                {c.roi !== null && <div style={{ fontSize: 11, color: c.roi >= 0 ? 'var(--sucesso)' : 'var(--erro)' }}>ROI {c.roi.toFixed(0)}%</div>}
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {aba === 1 && (
        <div className="card">
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {SEGMENTOS.map((s) => (
              <button
                key={s}
                onClick={() => setSegmento(s)}
                className={segmento === s ? 'btn' : ''}
                style={segmento !== s ? { background: 'none', border: '1px solid var(--borda)', color: 'var(--texto2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' } : { fontSize: 12, padding: '6px 12px' }}
              >
                {SEGMENTO_CLIENTE_LABEL[s]}
              </button>
            ))}
          </div>
          {!clientes.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum cliente nesse segmento.</p>}
          {clientes.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div>
                <strong>{c.nome || c.telefone}</strong>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{c.telefone}{c.dataNascimento ? ` · aniversário ${fmtDataMkt(c.dataNascimento)}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{fmtPrecoMkt(c.totalGasto)} · {c.totalPedidos} pedidos</div>
                {Number(c.saldoCashback) > 0 && <div style={{ fontSize: 11, color: 'var(--dourado)' }}>cashback: {fmtPrecoMkt(c.saldoCashback)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 2 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Cupons</h3>
            <button className="btn" onClick={abrirModalCupom}>+ Cupom</button>
          </div>
          {!cupons.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum cupom cadastrado.</p>}
          {cupons.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div>
                <strong>{c.codigo}</strong>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>
                  {c.tipoDesconto === 'PERCENTUAL' ? `${Number(c.valor)}%` : fmtPrecoMkt(c.valor)} de desconto
                  {c.usoMaximo ? ` · ${c.usosAtuais}/${c.usoMaximo} usos` : ` · ${c.usosAtuais} usos`}
                  {c.validoAte ? ` · válido até ${fmtDataMkt(c.validoAte)}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: c.ativo ? 'var(--sucesso)' : 'var(--texto2)' }}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                <button onClick={() => alternarAtivoCupom(c)} style={{ background: 'none', border: 'none', color: 'var(--dourado)', cursor: 'pointer', fontSize: 12 }}>{c.ativo ? 'Desativar' : 'Ativar'}</button>
                <button onClick={() => excluirCupomItem(c)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 3 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Campanhas</h3>
            <button className="btn" onClick={() => abrirModalCampanha(null)}>+ Campanha</button>
          </div>
          {!campanhas.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma campanha criada ainda.</p>}
          {campanhas.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div style={{ cursor: 'pointer' }} onClick={() => abrirModalCampanha(c)}>
                <strong>{CANAL_ICONE[c.canal]} {c.nome}</strong>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{CANAL_LABEL[c.canal]} · {c.segmento} · {STATUS_CAMPANHA_LABEL[c.status]}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div>{c.conversoes} conversões</div>
                  {c.roi !== null && <div style={{ fontSize: 11, color: c.roi >= 0 ? 'var(--sucesso)' : 'var(--erro)' }}>ROI {c.roi.toFixed(0)}%</div>}
                </div>
                <button onClick={() => excluirCampanhaItem(c)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 4 && (
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Avaliações de clientes</h3>
          {!avaliacoes.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma avaliação recebida ainda.</p>}
          {avaliacoes.map((a) => (
            <div key={a.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{'⭐'.repeat(a.nota)} {a.cliente?.nome || 'Cliente'}</strong>
                <span style={{ fontSize: 11, color: 'var(--texto2)' }}>Pedido #{a.pedido?.numero}</span>
              </div>
              {a.comentario && <div style={{ fontSize: 12.5, color: 'var(--texto2)', marginTop: 3 }}>{a.comentario}</div>}
            </div>
          ))}
        </div>
      )}

      <Modal titulo="Novo cupom" aberto={modalCupom} onFechar={() => setModalCupom(false)} largura={380}>
        <form onSubmit={handleSalvarCupom}>
          <label>Código</label>
          <input value={codigoCupom} onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())} autoFocus placeholder="Ex: PROMO10" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Tipo</label>
              <select value={tipoDescCupom} onChange={(e) => setTipoDescCupom(e.target.value)}>
                <option value="PERCENTUAL">Percentual (%)</option>
                <option value="FIXO">Valor fixo (R$)</option>
              </select>
            </div>
            <div><label>Valor</label><input type="number" step="0.01" min="0" value={valorCupom} onChange={(e) => setValorCupom(e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div><label>Limite de usos</label><input type="number" min="1" value={usoMaxCupom} onChange={(e) => setUsoMaxCupom(e.target.value)} placeholder="Sem limite" /></div>
            <div><label>Válido até</label><input type="date" value={validoAteCupom} onChange={(e) => setValidoAteCupom(e.target.value)} /></div>
          </div>
          {erroCupom && <div className="erro-msg">{erroCupom}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar</button>
        </form>
      </Modal>

      <Modal titulo={campanhaEditando ? 'Editar campanha' : 'Nova campanha'} aberto={modalCampanha} onFechar={() => setModalCampanha(false)} largura={480}>
        <form onSubmit={handleSalvarCampanha}>
          <label>Nome da campanha</label>
          <input value={nomeCamp} onChange={(e) => setNomeCamp(e.target.value)} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Canal</label>
              <select value={canalCamp} onChange={(e) => setCanalCamp(e.target.value)}>
                {Object.entries(CANAL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><label>Custo estimado (R$)</label><input type="number" step="0.01" min="0" value={custoCamp} onChange={(e) => setCustoCamp(e.target.value)} placeholder="Opcional" /></div>
          </div>
          <label style={{ marginTop: 12 }}>Público-alvo</label>
          <input value={segmentoCamp} onChange={(e) => setSegmentoCamp(e.target.value)} placeholder="Ex: Clientes VIP, Aniversariantes do mês" />
          <label style={{ marginTop: 12 }}>Cupom vinculado</label>
          <select value={cupomIdCamp} onChange={(e) => setCupomIdCamp(e.target.value)}>
            <option value="">Nenhum</option>
            {cupons.map((c) => <option key={c.id} value={c.id}>{c.codigo}</option>)}
          </select>

          {campanhaEditando && (
            <>
              <label style={{ marginTop: 12 }}>Status</label>
              <select value={statusCamp} onChange={(e) => setStatusCamp(e.target.value)}>
                <option value="RASCUNHO">Rascunho</option>
                <option value="ATIVA">Enviada</option>
                <option value="ENCERRADA">Encerrada</option>
              </select>
            </>
          )}

          <div style={{ marginTop: 16, padding: 12, border: '1px dashed var(--borda)', borderRadius: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>✨ Gerar texto com IA</div>
            <label>Objetivo da campanha</label>
            <textarea rows={2} value={objetivoCamp} onChange={(e) => setObjetivoCamp(e.target.value)} placeholder="Ex: Divulgar 20% de desconto em todos os pratos até domingo" />
            <label style={{ marginTop: 8 }}>Tom (opcional)</label>
            <input value={tomCamp} onChange={(e) => setTomCamp(e.target.value)} placeholder="Ex: descontraído, urgente, formal" />
            {erroIA && <div className="erro-msg">{erroIA}</div>}
            <button type="button" className="btn" style={{ width: '100%', marginTop: 10 }} onClick={handleGerarIA} disabled={gerandoIA}>
              {gerandoIA ? 'Gerando…' : '✨ Gerar texto com IA'}
            </button>
          </div>

          <label style={{ marginTop: 12 }}>Texto final da campanha</label>
          <textarea rows={5} value={textoCamp} onChange={(e) => setTextoCamp(e.target.value)} placeholder="Escreva manualmente ou gere com IA acima" />

          {erroCamp && <div className="erro-msg">{erroCamp}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar</button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
