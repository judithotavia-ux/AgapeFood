import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as fechamentoService from '../services/fechamentoGorjetaService';
import * as configuracaoGorjetaService from '../services/configuracaoGorjetaService';
import * as garcomService from '../services/garcomService';

const STATUS_LABEL = { CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado' };
const STATUS_DIST_LABEL = { PENDENTE: 'Pendente', PAGO: 'Pago', CANCELADO: 'Cancelado' };
const STATUS_DIST_COR = { PENDENTE: '#e0a020', PAGO: 'var(--sucesso)', CANCELADO: 'var(--texto2)' };

function fmtPreco(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR');
}
function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function FechamentoGorjetas() {
  const [config, setConfig] = useState(null);
  const [garcons, setGarcons] = useState([]);
  const [periodoInicio, setPeriodoInicio] = useState(hojeISO());
  const [periodoFim, setPeriodoFim] = useState(hojeISO());
  const [horasPorGarcom, setHorasPorGarcom] = useState({});

  const [painel, setPainel] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
  const [exportando, setExportando] = useState(false);

  const [preview, setPreview] = useState(null);
  const [carregandoPreview, setCarregandoPreview] = useState(false);
  const [erroPreview, setErroPreview] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const [fechamentos, setFechamentos] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [detalhe, setDetalhe] = useState(null);

  const [modalPagar, setModalPagar] = useState(null);
  const [formaPagamentoPagar, setFormaPagamentoPagar] = useState('PIX');

  async function carregarBase() {
    const [c, g] = await Promise.all([configuracaoGorjetaService.obterConfiguracaoGorjeta(), garcomService.listarGarcons()]);
    setConfig(c);
    setGarcons(g.filter((x) => x.statusGarcom === 'ATIVO'));
  }

  async function carregarFechamentos() {
    setCarregandoLista(true);
    const lista = await fechamentoService.listarFechamentos();
    setFechamentos(lista);
    setCarregandoLista(false);
  }

  async function carregarPainel() {
    const dados = await fechamentoService.obterDashboardGorjetas();
    setPainel(dados);
  }

  useEffect(() => { carregarBase(); carregarFechamentos(); carregarPainel(); }, []);

  async function gerarRelatorio() {
    setCarregandoRelatorio(true);
    setRelatorio(null);
    try {
      const dados = await fechamentoService.obterRelatorioGorjetas(periodoInicio, periodoFim);
      setRelatorio(dados);
    } finally {
      setCarregandoRelatorio(false);
    }
  }

  async function exportarCsv() {
    setExportando(true);
    try {
      await fechamentoService.baixarRelatorioCsv(periodoInicio, periodoFim);
    } finally {
      setExportando(false);
    }
  }

  function definirPeriodoRapido(dias) {
    const fim = new Date();
    const inicio = new Date(Date.now() - (dias - 1) * 86400000);
    setPeriodoInicio(inicio.toISOString().slice(0, 10));
    setPeriodoFim(fim.toISOString().slice(0, 10));
    setPreview(null);
  }

  async function calcularPreview() {
    setCarregandoPreview(true);
    setErroPreview('');
    setPreview(null);
    try {
      const resultado = await fechamentoService.previewFechamento(periodoInicio, periodoFim, { horas: horasPorGarcom });
      setPreview(resultado);
    } catch (err) {
      setErroPreview(err.response?.data?.erro || 'Não foi possível calcular o preview.');
    } finally {
      setCarregandoPreview(false);
    }
  }

  async function confirmar() {
    if (!confirm('Confirmar esse fechamento? Os pedidos incluídos deixam de poder entrar em outro fechamento.')) return;
    setConfirmando(true);
    try {
      await fechamentoService.confirmarFechamento({ periodoInicio, periodoFim, horasPorGarcom });
      setPreview(null);
      carregarFechamentos();
    } catch (err) {
      setErroPreview(err.response?.data?.erro || 'Não foi possível confirmar o fechamento.');
    } finally {
      setConfirmando(false);
    }
  }

  async function abrirDetalhe(f) {
    const completo = await fechamentoService.obterFechamento(f.id);
    setDetalhe(completo);
  }

  async function cancelarFechamentoAtual() {
    if (!confirm('Cancelar esse fechamento? Os pedidos voltam a ficar disponíveis para um novo fechamento.')) return;
    try {
      await fechamentoService.cancelarFechamento(detalhe.id);
      setDetalhe(null);
      carregarFechamentos();
    } catch (err) {
      alert(err.response?.data?.erro || 'Não foi possível cancelar.');
    }
  }

  async function confirmarPagamento(e) {
    e.preventDefault();
    await fechamentoService.marcarDistribuicaoPaga(detalhe.id, modalPagar.id, { formaPagamento: formaPagamentoPagar });
    setModalPagar(null);
    abrirDetalhe(detalhe);
  }

  const precisaHoras = config?.regraRateio === 'HORAS' && config?.modeloDistribuicao === 'COLETIVO';

  return (
    <AdminLayout titulo="Fechamento de Gorjetas">
      {!detalhe ? (
        <>
          {painel && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="card">
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(painel.gorjetasHoje)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Gorjetas hoje</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(painel.gorjetasSemana)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Últimos 7 dias</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(painel.gorjetasMes)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Gorjetas no mês</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e0a020' }}>{fmtPreco(painel.totalPendente)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Total pendente</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--sucesso)' }}>{fmtPreco(painel.totalPago)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Total pago</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 700 }}>{painel.topVendedorMes?.nome || '—'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Quem mais vendeu (mês)</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 15, fontWeight: 700 }}>{painel.topGorjetaMes?.nome || '—'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Quem mais gerou gorjeta (mês)</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtPreco(painel.ticketMedioMes)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Ticket médio (mês)</div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, margin: 0 }}>Relatório por garçom</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-outline" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={gerarRelatorio} disabled={carregandoRelatorio}>
                  {carregandoRelatorio ? 'Gerando…' : 'Gerar relatório do período'}
                </button>
                <button className="btn-outline" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={exportarCsv} disabled={exportando}>
                  {exportando ? 'Exportando…' : '⬇ Exportar CSV'}
                </button>
              </div>
            </div>
            {relatorio && (
              relatorio.length === 0 ? (
                <div style={{ color: 'var(--texto2)', fontSize: 13 }}>Nenhum dado nesse período.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--borda)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 6px' }}>Garçom</th>
                        <th style={{ padding: '8px 6px' }}>Vendas</th>
                        <th style={{ padding: '8px 6px' }}>Gorjeta gerada</th>
                        <th style={{ padding: '8px 6px' }}>Gorjeta rateada</th>
                        <th style={{ padding: '8px 6px' }}>Paga</th>
                        <th style={{ padding: '8px 6px' }}>Pendente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorio.map((l, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--borda)' }}>
                          <td style={{ padding: '8px 6px' }}>{l.garcom}</td>
                          <td style={{ padding: '8px 6px' }}>{fmtPreco(l.vendas)}</td>
                          <td style={{ padding: '8px 6px' }}>{fmtPreco(l.gorjetaGerada)}</td>
                          <td style={{ padding: '8px 6px' }}>{fmtPreco(l.gorjetaRateada)}</td>
                          <td style={{ padding: '8px 6px', color: 'var(--sucesso)' }}>{fmtPreco(l.gorjetaPaga)}</td>
                          <td style={{ padding: '8px 6px', color: '#e0a020' }}>{fmtPreco(l.gorjetaPendente)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Novo fechamento</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <button className="btn-outline" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={() => definirPeriodoRapido(1)}>Hoje</button>
              <button className="btn-outline" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={() => definirPeriodoRapido(2)}>Ontem + hoje</button>
              <button className="btn-outline" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={() => definirPeriodoRapido(7)}>Últimos 7 dias</button>
              <button className="btn-outline" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={() => definirPeriodoRapido(15)}>Últimos 15 dias</button>
              <button className="btn-outline" style={{ fontSize: 12.5, padding: '7px 12px' }} onClick={() => definirPeriodoRapido(30)}>Último mês</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 420, marginBottom: 14 }}>
              <div>
                <label>De</label>
                <input type="date" value={periodoInicio} onChange={(e) => { setPeriodoInicio(e.target.value); setPreview(null); }} />
              </div>
              <div>
                <label>Até</label>
                <input type="date" value={periodoFim} onChange={(e) => { setPeriodoFim(e.target.value); setPreview(null); }} />
              </div>
            </div>

            {precisaHoras && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--texto2)', marginBottom: 8 }}>Horas trabalhadas no período</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {garcons.map((g) => (
                    <div key={g.id}>
                      <label>{g.nomeExibicao || g.nome}</label>
                      <input
                        type="number" min="0" step="0.5"
                        value={horasPorGarcom[g.id] || ''}
                        onChange={(e) => setHorasPorGarcom({ ...horasPorGarcom, [g.id]: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn" onClick={calcularPreview} disabled={carregandoPreview}>
              {carregandoPreview ? 'Calculando…' : 'Calcular preview'}
            </button>

            {erroPreview && <div className="erro-msg">{erroPreview}</div>}

            {preview && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--borda)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(preview.totalVendido)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Total vendido no período</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(preview.totalGorjetas)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Total de gorjetas</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{preview.config.modeloDistribuicao === 'INDIVIDUAL' ? 'Individual' : 'Coletivo'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>Modelo de distribuição</div>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  {preview.distribuicao.map((d) => (
                    <div key={d.garcomId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borda)', fontSize: 13.5 }}>
                      <div>
                        <strong>{d.nome}</strong>
                        <span style={{ color: 'var(--texto2)', marginLeft: 8, fontSize: 12 }}>{d.criterioTexto}</span>
                      </div>
                      <div style={{ color: 'var(--dourado)', fontWeight: 600 }}>{fmtPreco(d.valor)}</div>
                    </div>
                  ))}
                </div>

                <button className="btn" onClick={confirmar} disabled={confirmando}>
                  {confirmando ? 'Confirmando…' : 'Confirmar fechamento'}
                </button>
              </div>
            )}
          </div>

          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Histórico de fechamentos</h3>
          {carregandoLista ? (
            <div style={{ color: 'var(--texto2)' }}>Carregando…</div>
          ) : fechamentos.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)', padding: 30 }}>Nenhum fechamento ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fechamentos.map((f) => (
                <div key={f.id} className="card" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => abrirDetalhe(f)}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{fmtData(f.periodoInicio)} — {fmtData(f.periodoFim)}</div>
                    <div style={{ fontSize: 12, color: 'var(--texto2)' }}>{f.modeloDistribuicao === 'INDIVIDUAL' ? 'Individual' : `Coletivo · ${f.regraRateio}`} · {f._count.distribuicoes} garçom(ns) · criado por {f.criadoPor.nome}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(f.totalGorjetas)}</div>
                    <div style={{ fontSize: 11, color: f.status === 'CANCELADO' ? 'var(--erro)' : 'var(--texto2)' }}>{STATUS_LABEL[f.status]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          <button className="btn-outline" style={{ marginBottom: 16 }} onClick={() => setDetalhe(null)}>← Voltar</button>

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 16 }}>{fmtData(detalhe.periodoInicio)} — {fmtData(detalhe.periodoFim)}</h3>
                <div style={{ fontSize: 12.5, color: 'var(--texto2)', marginTop: 4 }}>
                  {detalhe.modeloDistribuicao === 'INDIVIDUAL' ? 'Individual' : `Coletivo · ${detalhe.regraRateio}`} · Criado por {detalhe.criadoPor.nome} em {fmtData(detalhe.criadoEm)}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: detalhe.status === 'CANCELADO' ? 'var(--erro)' : 'var(--sucesso)' }}>{STATUS_LABEL[detalhe.status]}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtPreco(detalhe.totalVendido)}</div>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>Vendido</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(detalhe.totalGorjetas)}</div>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>Gorjetas ({detalhe.pedidos.length} pedidos)</div>
              </div>
            </div>
            {detalhe.status !== 'CANCELADO' && detalhe.distribuicoes.every((d) => d.status !== 'PAGO') && (
              <button className="btn-outline" style={{ marginTop: 16, color: 'var(--erro)', borderColor: 'rgba(224,102,102,.4)' }} onClick={cancelarFechamentoAtual}>
                Cancelar fechamento
              </button>
            )}
          </div>

          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Distribuição por garçom</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {detalhe.distribuicoes.map((d) => (
              <div key={d.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{d.garcom.nomeExibicao || d.garcom.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--texto2)' }}>{d.criterioTexto}</div>
                  {d.status === 'PAGO' && <div style={{ fontSize: 11, color: 'var(--sucesso)' }}>Pago em {fmtData(d.pagoEm)} · {d.formaPagamento}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dourado)' }}>{fmtPreco(d.valor)}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_DIST_COR[d.status] }}>{STATUS_DIST_LABEL[d.status]}</span>
                  {d.status === 'PENDENTE' && (
                    <button className="btn" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => { setModalPagar(d); setFormaPagamentoPagar('PIX'); }}>
                      Marcar pago
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal titulo={`Pagar gorjeta — ${modalPagar?.garcom?.nomeExibicao || modalPagar?.garcom?.nome || ''}`} aberto={!!modalPagar} onFechar={() => setModalPagar(null)} largura={360}>
        <form onSubmit={confirmarPagamento}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--dourado)', marginBottom: 16 }}>{fmtPreco(modalPagar?.valor)}</div>
          <label>Forma de pagamento</label>
          <select value={formaPagamentoPagar} onChange={(e) => setFormaPagamentoPagar(e.target.value)}>
            <option value="PIX">Pix</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="TRANSFERENCIA">Transferência</option>
            <option value="OUTRO">Outro</option>
          </select>
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Confirmar pagamento</button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
