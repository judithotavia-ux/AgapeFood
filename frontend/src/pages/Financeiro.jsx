import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import BloqueioPlano from '../components/BloqueioPlano';
import * as financeiroService from '../services/financeiroService';
import {
  STATUS_CONTA_LABEL, STATUS_CONTA_COR, FORMA_PAGAMENTO_LABEL, SAUDE_FINANCEIRA_LABEL, fmtPrecoFin, fmtMes
} from '../utils/financeiroConstantes';

const ABAS = ['Visão geral', 'Contas a Pagar', 'Contas a Receber', 'Fluxo de Caixa', 'Categorias'];

function mesAtualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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

function GraficoComparativo({ dados }) {
  const max = Math.max(1, ...dados.map((d) => Math.max(d.entradas, d.saidas)));
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 15, marginBottom: 14 }}>Comparativo dos últimos 12 meses</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, overflowX: 'auto' }}>
        {dados.map((d) => (
          <div key={d.mes} style={{ flex: 1, minWidth: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 100 }}>
              <div title={`Entradas: ${fmtPrecoFin(d.entradas)}`} style={{ width: 10, height: `${(d.entradas / max) * 100}%`, minHeight: d.entradas ? 3 : 0, background: 'var(--sucesso)', borderRadius: '3px 3px 0 0' }} />
              <div title={`Saídas: ${fmtPrecoFin(d.saidas)}`} style={{ width: 10, height: `${(d.saidas / max) * 100}%`, minHeight: d.saidas ? 3 : 0, background: 'var(--erro)', borderRadius: '3px 3px 0 0' }} />
            </div>
            <div style={{ fontSize: 9, color: 'var(--texto2)' }}>{fmtMes(d.mes)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--texto2)' }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, background: 'var(--sucesso)', borderRadius: 2, marginRight: 5 }} />Entradas</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, background: 'var(--erro)', borderRadius: 2, marginRight: 5 }} />Saídas</span>
      </div>
    </div>
  );
}

export default function Financeiro() {
  const [aba, setAba] = useState(0);
  const [mes, setMes] = useState(mesAtualISO());
  const [resumo, setResumo] = useState(null);
  const [fluxo, setFluxo] = useState(null);
  const [contasPagar, setContasPagar] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [planoAtual, setPlanoAtual] = useState(null);

  const [modalPagar, setModalPagar] = useState(false);
  const [descPagar, setDescPagar] = useState('');
  const [valorPagar, setValorPagar] = useState('');
  const [vencPagar, setVencPagar] = useState('');
  const [catPagarId, setCatPagarId] = useState('');
  const [formaPagar, setFormaPagar] = useState('');
  const [erroPagar, setErroPagar] = useState('');

  const [modalReceber, setModalReceber] = useState(false);
  const [descReceber, setDescReceber] = useState('');
  const [valorReceber, setValorReceber] = useState('');
  const [vencReceber, setVencReceber] = useState('');
  const [clienteReceber, setClienteReceber] = useState('');
  const [catReceberId, setCatReceberId] = useState('');
  const [erroReceber, setErroReceber] = useState('');

  const [modalCategoria, setModalCategoria] = useState(false);
  const [nomeCat, setNomeCat] = useState('');
  const [tipoCat, setTipoCat] = useState('DESPESA');
  const [erroCat, setErroCat] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const [r, cp, cr, cat] = await Promise.all([
        financeiroService.obterResumoFinanceiro(mes),
        financeiroService.listarContasPagar(),
        financeiroService.listarContasReceber(),
        financeiroService.listarCategoriasFinanceiras()
      ]);
      setResumo(r); setContasPagar(cp); setContasReceber(cr); setCategorias(cat);
    } catch (e) {
      if (e.response?.data?.precisaUpgrade) { setBloqueado(true); setPlanoAtual(e.response.data.planoAtual); }
      else throw e;
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [mes]);

  useEffect(() => {
    if (aba === 3) financeiroService.obterFluxoCaixa(mes).then(setFluxo);
  }, [aba, mes]);

  function abrirModalPagar() {
    setDescPagar(''); setValorPagar(''); setVencPagar(''); setCatPagarId(''); setFormaPagar(''); setErroPagar('');
    setModalPagar(true);
  }

  async function handleSalvarPagar(e) {
    e.preventDefault();
    if (!descPagar.trim()) return setErroPagar('Informe a descrição.');
    if (!valorPagar || isNaN(Number(valorPagar)) || Number(valorPagar) <= 0) return setErroPagar('Informe um valor válido.');
    if (!vencPagar) return setErroPagar('Informe o vencimento.');
    try {
      await financeiroService.criarContaPagar({ descricao: descPagar, valor: Number(valorPagar), vencimento: vencPagar, categoriaId: catPagarId || undefined, formaPagamento: formaPagar || undefined });
      setModalPagar(false);
      await carregar();
    } catch (err) {
      setErroPagar(err.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function marcarPago(conta) {
    await financeiroService.pagarContaPagar(conta.id, {});
    carregar();
  }

  async function cancelarPagar(conta) {
    if (!confirm('Cancelar essa conta a pagar?')) return;
    await financeiroService.cancelarContaPagar(conta.id);
    carregar();
  }

  async function excluirPagar(conta) {
    if (!confirm('Excluir essa conta a pagar?')) return;
    await financeiroService.excluirContaPagar(conta.id);
    carregar();
  }

  function abrirModalReceber() {
    setDescReceber(''); setValorReceber(''); setVencReceber(''); setClienteReceber(''); setCatReceberId(''); setErroReceber('');
    setModalReceber(true);
  }

  async function handleSalvarReceber(e) {
    e.preventDefault();
    if (!descReceber.trim()) return setErroReceber('Informe a descrição.');
    if (!valorReceber || isNaN(Number(valorReceber)) || Number(valorReceber) <= 0) return setErroReceber('Informe um valor válido.');
    if (!vencReceber) return setErroReceber('Informe o vencimento.');
    try {
      await financeiroService.criarContaReceber({ descricao: descReceber, valor: Number(valorReceber), vencimento: vencReceber, clienteNome: clienteReceber || undefined, categoriaId: catReceberId || undefined });
      setModalReceber(false);
      await carregar();
    } catch (err) {
      setErroReceber(err.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function marcarRecebido(conta) {
    await financeiroService.receberContaReceber(conta.id, {});
    carregar();
  }

  async function cancelarReceber(conta) {
    if (!confirm('Cancelar essa conta a receber?')) return;
    await financeiroService.cancelarContaReceber(conta.id);
    carregar();
  }

  async function excluirReceber(conta) {
    if (!confirm('Excluir essa conta a receber?')) return;
    await financeiroService.excluirContaReceber(conta.id);
    carregar();
  }

  function abrirModalCategoria() {
    setNomeCat(''); setTipoCat('DESPESA'); setErroCat('');
    setModalCategoria(true);
  }

  async function handleSalvarCategoria(e) {
    e.preventDefault();
    if (!nomeCat.trim()) return setErroCat('Informe o nome.');
    try {
      await financeiroService.criarCategoriaFinanceira({ nome: nomeCat, tipo: tipoCat });
      setModalCategoria(false);
      await carregar();
    } catch (err) {
      setErroCat(err.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function excluirCategoria(id) {
    if (!confirm('Excluir essa categoria?')) return;
    await financeiroService.excluirCategoriaFinanceira(id);
    carregar();
  }

  if (bloqueado) return <AdminLayout titulo="Financeiro"><BloqueioPlano planoAtual={planoAtual} /></AdminLayout>;
  if (carregando || !resumo) return <AdminLayout titulo="Financeiro"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;

  return (
    <AdminLayout titulo="Financeiro">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <label style={{ marginBottom: 4 }}>Mês de referência</label>
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ width: 190 }} />
        </div>
        <div style={{ fontSize: 13 }}>{SAUDE_FINANCEIRA_LABEL[resumo.saudeFinanceira.classificacao]} · margem de lucro {resumo.saudeFinanceira.margemLucro.toFixed(1)}%</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
        <CartaoStat label="Saldo atual" valor={fmtPrecoFin(resumo.saldoAtual)} icone="🏦" />
        <CartaoStat label="Entradas (mês)" valor={fmtPrecoFin(resumo.entradas)} icone="📈" cor="var(--sucesso)" />
        <CartaoStat label="Saídas (mês)" valor={fmtPrecoFin(resumo.saidas)} icone="📉" cor="var(--erro)" />
        <CartaoStat
          label={resumo.lucro >= 0 ? 'Lucro (mês)' : 'Prejuízo (mês)'}
          valor={fmtPrecoFin(Math.abs(resumo.lucro))}
          icone={resumo.lucro >= 0 ? '💰' : '⚠️'}
          cor={resumo.lucro >= 0 ? 'var(--sucesso)' : 'var(--erro)'}
        />
        <CartaoStat label="Ticket médio" valor={fmtPrecoFin(resumo.ticketMedio)} icone="🧾" />
        <CartaoStat label="Contas a pagar" valor={fmtPrecoFin(resumo.contasPagar.total)} icone="🔴" cor="var(--erro)" />
        <CartaoStat label="Contas a receber" valor={fmtPrecoFin(resumo.contasReceber.total)} icone="🟢" cor="var(--sucesso)" />
      </div>

      <GraficoComparativo dados={resumo.grafico} />

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
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>DRE simplificado (mês)</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
              <span>Receita</span><strong style={{ color: 'var(--sucesso)' }}>{fmtPrecoFin(resumo.dre.receita)}</strong>
            </div>
            {resumo.dre.despesasPorCategoria.map((d) => (
              <div key={d.categoria} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0 5px 16px', fontSize: 12.5, color: 'var(--texto2)' }}>
                <span>(−) {d.categoria}</span><span>{fmtPrecoFin(d.valor)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--borda)', marginTop: 8, fontSize: 14, fontWeight: 700 }}>
              <span>Resultado</span><span style={{ color: resumo.dre.resultado >= 0 ? 'var(--sucesso)' : 'var(--erro)' }}>{fmtPrecoFin(resumo.dre.resultado)}</span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Entradas por forma de pagamento</h3>
            {Object.entries(resumo.porFormaPagamento).map(([forma, valor]) => (
              <div key={forma} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--borda)' }}>
                <span>{FORMA_PAGAMENTO_LABEL[forma] || forma}</span><span>{fmtPrecoFin(valor)}</span>
              </div>
            ))}
            {!Object.keys(resumo.porFormaPagamento).length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum pedido no período.</p>}
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>Projeção para o próximo mês</h3>
            <p style={{ fontSize: 11, color: 'var(--texto2)', marginBottom: 12 }}>{resumo.projecaoProximoMes.metodo}</p>
            <div style={{ display: 'flex', gap: 24 }}>
              <div><div style={{ fontSize: 11, color: 'var(--texto2)' }}>Entradas estimadas</div><strong style={{ color: 'var(--sucesso)' }}>{fmtPrecoFin(resumo.projecaoProximoMes.entradas)}</strong></div>
              <div><div style={{ fontSize: 11, color: 'var(--texto2)' }}>Saídas estimadas</div><strong style={{ color: 'var(--erro)' }}>{fmtPrecoFin(resumo.projecaoProximoMes.saidas)}</strong></div>
            </div>
          </div>

          {!!resumo.alertasDespesa.length && (
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 12, color: 'var(--erro)' }}>⚠️ Alertas de despesa</h3>
              {resumo.alertasDespesa.map((a) => (
                <div key={a.categoria} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
                  <span>{a.categoria}</span>
                  <span style={{ color: 'var(--erro)' }}>{fmtPrecoFin(a.valorAtual)} (+{a.variacaoPercentual.toFixed(0)}% vs mês anterior)</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {aba === 1 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Contas a Pagar</h3>
            <button className="btn" onClick={abrirModalPagar}>+ Conta a pagar</button>
          </div>
          {!contasPagar.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma conta cadastrada.</p>}
          {contasPagar.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div>
                <strong>{c.descricao}</strong>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{c.categoria?.nome || 'Sem categoria'}{c.fornecedor ? ` · ${c.fornecedor.nome}` : ''} · vence {new Date(c.vencimento).toLocaleDateString('pt-BR')}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: STATUS_CONTA_COR[c.statusEfetivo] }}>{STATUS_CONTA_LABEL[c.statusEfetivo]}</span>
                <strong>{fmtPrecoFin(c.valor)}</strong>
                {c.status === 'PENDENTE' && <button onClick={() => marcarPago(c)} style={{ background: 'none', border: 'none', color: 'var(--sucesso)', cursor: 'pointer', fontSize: 12 }}>Pagar</button>}
                {c.status === 'PENDENTE' && <button onClick={() => cancelarPagar(c)} style={{ background: 'none', border: 'none', color: 'var(--texto2)', cursor: 'pointer', fontSize: 12 }}>Cancelar</button>}
                <button onClick={() => excluirPagar(c)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 2 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Contas a Receber</h3>
            <button className="btn" onClick={abrirModalReceber}>+ Conta a receber</button>
          </div>
          {!contasReceber.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma conta cadastrada.</p>}
          {contasReceber.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div>
                <strong>{c.descricao}</strong>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{c.categoria?.nome || 'Sem categoria'}{c.clienteNome ? ` · ${c.clienteNome}` : ''} · vence {new Date(c.vencimento).toLocaleDateString('pt-BR')}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: STATUS_CONTA_COR[c.statusEfetivo] }}>{STATUS_CONTA_LABEL[c.statusEfetivo]}</span>
                <strong>{fmtPrecoFin(c.valor)}</strong>
                {c.status === 'PENDENTE' && <button onClick={() => marcarRecebido(c)} style={{ background: 'none', border: 'none', color: 'var(--sucesso)', cursor: 'pointer', fontSize: 12 }}>Receber</button>}
                {c.status === 'PENDENTE' && <button onClick={() => cancelarReceber(c)} style={{ background: 'none', border: 'none', color: 'var(--texto2)', cursor: 'pointer', fontSize: 12 }}>Cancelar</button>}
                <button onClick={() => excluirReceber(c)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 3 && (
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Fluxo de Caixa</h3>
          {!fluxo && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Carregando…</p>}
          {fluxo && (
            <>
              <div style={{ display: 'flex', gap: 24, marginBottom: 14, fontSize: 13 }}>
                <span>Entradas: <strong style={{ color: 'var(--sucesso)' }}>{fmtPrecoFin(fluxo.totalEntradas)}</strong></span>
                <span>Saídas: <strong style={{ color: 'var(--erro)' }}>{fmtPrecoFin(fluxo.totalSaidas)}</strong></span>
              </div>
              {!fluxo.lancamentos.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum lançamento no período.</p>}
              {fluxo.lancamentos.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--borda)', fontSize: 12.5 }}>
                  <div>
                    <span>{l.origem}</span>
                    <div style={{ fontSize: 10.5, color: 'var(--texto2)' }}>{new Date(l.data).toLocaleString('pt-BR')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: l.tipo === 'ENTRADA' ? 'var(--sucesso)' : 'var(--erro)' }}>{l.tipo === 'ENTRADA' ? '+' : '−'}{fmtPrecoFin(l.valor)}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--texto2)' }}>saldo: {fmtPrecoFin(l.saldoAcumulado)}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {aba === 4 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Categorias financeiras</h3>
            <button className="btn" onClick={abrirModalCategoria}>+ Categoria</button>
          </div>
          {!categorias.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma categoria cadastrada.</p>}
          {categorias.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <span>{c.nome} <span style={{ fontSize: 10.5, color: c.tipo === 'RECEITA' ? 'var(--sucesso)' : 'var(--erro)' }}>({c.tipo === 'RECEITA' ? 'Receita' : 'Despesa'})</span></span>
              <button onClick={() => excluirCategoria(c.id)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
            </div>
          ))}
        </div>
      )}

      <Modal titulo="Nova conta a pagar" aberto={modalPagar} onFechar={() => setModalPagar(false)} largura={420}>
        <form onSubmit={handleSalvarPagar}>
          <label>Descrição</label>
          <input value={descPagar} onChange={(e) => setDescPagar(e.target.value)} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div><label>Valor (R$)</label><input type="number" step="0.01" min="0" value={valorPagar} onChange={(e) => setValorPagar(e.target.value)} /></div>
            <div><label>Vencimento</label><input type="date" value={vencPagar} onChange={(e) => setVencPagar(e.target.value)} /></div>
          </div>
          <label style={{ marginTop: 12 }}>Categoria</label>
          <select value={catPagarId} onChange={(e) => setCatPagarId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categorias.filter((c) => c.tipo === 'DESPESA').map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <label style={{ marginTop: 12 }}>Forma de pagamento prevista</label>
          <select value={formaPagar} onChange={(e) => setFormaPagar(e.target.value)}>
            <option value="">Não definida</option>
            {Object.entries(FORMA_PAGAMENTO_LABEL).filter(([v]) => v !== 'NAO_INFORMADO').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {erroPagar && <div className="erro-msg">{erroPagar}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar</button>
        </form>
      </Modal>

      <Modal titulo="Nova conta a receber" aberto={modalReceber} onFechar={() => setModalReceber(false)} largura={420}>
        <form onSubmit={handleSalvarReceber}>
          <label>Descrição</label>
          <input value={descReceber} onChange={(e) => setDescReceber(e.target.value)} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div><label>Valor (R$)</label><input type="number" step="0.01" min="0" value={valorReceber} onChange={(e) => setValorReceber(e.target.value)} /></div>
            <div><label>Vencimento</label><input type="date" value={vencReceber} onChange={(e) => setVencReceber(e.target.value)} /></div>
          </div>
          <label style={{ marginTop: 12 }}>Cliente</label>
          <input value={clienteReceber} onChange={(e) => setClienteReceber(e.target.value)} placeholder="Opcional" />
          <label style={{ marginTop: 12 }}>Categoria</label>
          <select value={catReceberId} onChange={(e) => setCatReceberId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categorias.filter((c) => c.tipo === 'RECEITA').map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {erroReceber && <div className="erro-msg">{erroReceber}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar</button>
        </form>
      </Modal>

      <Modal titulo="Nova categoria financeira" aberto={modalCategoria} onFechar={() => setModalCategoria(false)} largura={360}>
        <form onSubmit={handleSalvarCategoria}>
          <label>Nome</label>
          <input value={nomeCat} onChange={(e) => setNomeCat(e.target.value)} autoFocus placeholder="Ex: Aluguel, Fornecedores, Vendas" />
          <label style={{ marginTop: 12 }}>Tipo</label>
          <select value={tipoCat} onChange={(e) => setTipoCat(e.target.value)}>
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
          </select>
          {erroCat && <div className="erro-msg">{erroCat}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar</button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
