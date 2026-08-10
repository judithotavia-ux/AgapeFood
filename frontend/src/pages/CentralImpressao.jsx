import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import * as impressaoService from '../services/impressaoService';
import { obterSocket } from '../services/socket';
import {
  SETOR_LABEL, STATUS_IMPRESSORA_LABEL, STATUS_IMPRESSORA_COR, STATUS_IMPRESSORA_ICONE,
  STATUS_JOB_LABEL, STATUS_JOB_COR, TIPO_DOCUMENTO_LABEL, PRIORIDADE_LABEL, PRIORIDADE_COR, LOG_ACAO_LABEL
} from '../utils/impressaoConstantes';

const ABAS = ['Visão geral', 'Fila de impressão', 'Logs de auditoria'];
const FILTROS_STATUS = ['TODOS', 'PENDING', 'RETRYING', 'PRINTING', 'PRINTED', 'FAILED', 'CANCELLED'];

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

export default function CentralImpressao() {
  const [aba, setAba] = useState(0);
  const [resumo, setResumo] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarResumo() {
    const r = await impressaoService.obterResumoImpressao();
    setResumo(r);
  }

  async function carregarJobs() {
    const lista = await impressaoService.listarPrintJobs(filtroStatus !== 'TODOS' ? { status: filtroStatus } : {});
    setJobs(lista);
  }

  async function carregarLogs() {
    const lista = await impressaoService.listarPrintLogs();
    setLogs(lista);
  }

  useEffect(() => {
    async function carregarTudo() {
      setCarregando(true);
      await Promise.all([carregarResumo(), carregarJobs(), carregarLogs()]);
      setCarregando(false);
    }
    carregarTudo();
  }, []);

  useEffect(() => { carregarJobs(); }, [filtroStatus]);

  useEffect(() => {
    const socket = obterSocket();
    const atualizar = () => { carregarResumo(); carregarJobs(); };
    socket?.on('impressao:novo-job', atualizar);
    socket?.on('impressao:job-atualizado', atualizar);
    return () => {
      socket?.off('impressao:novo-job', atualizar);
      socket?.off('impressao:job-atualizado', atualizar);
    };
  }, [filtroStatus]);

  async function handleReimprimir(job) {
    await impressaoService.reimprimirPrintJob(job.id);
    carregarJobs();
  }

  async function handleRetry(job) {
    await impressaoService.retryPrintJob(job.id);
    carregarJobs();
  }

  async function handleCancelar(job) {
    if (!confirm('Cancelar esse job de impressão?')) return;
    await impressaoService.cancelarPrintJob(job.id);
    carregarJobs();
  }

  if (carregando || !resumo) return <AdminLayout titulo="Central de Impressão"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;

  return (
    <AdminLayout titulo="Central de Impressão">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
        <CartaoStat label="Impressoras online" valor={resumo.impressorasOnline} icone="🟢" cor="var(--sucesso)" />
        <CartaoStat label="Impressoras offline" valor={resumo.impressorasOffline} icone="⚪" />
        <CartaoStat label="Impressoras em atenção" valor={resumo.impressorasAtencao} icone="🟡" cor="#e0a020" />
        <CartaoStat label="Fila pendente" valor={resumo.filaPendente} icone="⏳" />
        <CartaoStat label="Impressões hoje" valor={resumo.impressoesHoje} icone="🖨️" cor="var(--sucesso)" />
        <CartaoStat label="Com erro" valor={resumo.impressoesComErro} icone="⚠️" cor="var(--erro)" />
        <CartaoStat label="Tempo médio" valor={resumo.tempoMedioSegundos ? `${resumo.tempoMedioSegundos.toFixed(1)}s` : '—'} icone="⏱️" />
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
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Status das impressoras</h3>
          {!resumo.impressoras.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma impressora cadastrada.</p>}
          {resumo.impressoras.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div>
                <strong>{p.nome}</strong>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{SETOR_LABEL[p.setor]}{!p.ativa ? ' · inativa' : ''}{p.padrao ? ' · padrão' : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: STATUS_IMPRESSORA_COR[p.status] }}>{STATUS_IMPRESSORA_ICONE[p.status]} {STATUS_IMPRESSORA_LABEL[p.status]}</div>
                {p.ultimaImpressaoEm && <div style={{ fontSize: 10.5, color: 'var(--texto2)' }}>{new Date(p.ultimaImpressaoEm).toLocaleString('pt-BR')}</div>}
              </div>
            </div>
          ))}

          {resumo.ultimaImpressao && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--borda)' }}>
              <div style={{ fontSize: 11, color: 'var(--texto2)', marginBottom: 4 }}>Última impressão realizada</div>
              <div style={{ fontSize: 13 }}>
                {TIPO_DOCUMENTO_LABEL[resumo.ultimaImpressao.tipoDocumento]} · {resumo.ultimaImpressao.printer?.nome}
                {resumo.ultimaImpressao.pedido ? ` · Pedido #${resumo.ultimaImpressao.pedido.numero}` : ''}
                {' · '}{new Date(resumo.ultimaImpressao.impressoEm).toLocaleString('pt-BR')}
              </div>
            </div>
          )}
        </div>
      )}

      {aba === 1 && (
        <div className="card">
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {FILTROS_STATUS.map((s) => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                style={filtroStatus === s
                  ? { background: 'var(--dourado)', color: '#16130a', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }
                  : { background: 'none', border: '1px solid var(--borda)', color: 'var(--texto2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
              >
                {s === 'TODOS' ? 'Todos' : STATUS_JOB_LABEL[s]}
              </button>
            ))}
          </div>

          {!jobs.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum job de impressão encontrado.</p>}
          {jobs.map((j) => (
            <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)', fontSize: 13, gap: 10, flexWrap: 'wrap' }}>
              <div>
                <strong>{TIPO_DOCUMENTO_LABEL[j.tipoDocumento]}</strong>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>
                  {j.printer?.nome} ({SETOR_LABEL[j.setor]}){j.pedido ? ` · Pedido #${j.pedido.numero}` : ''} · {new Date(j.criadoEm).toLocaleString('pt-BR')}
                </div>
                {j.erro && <div style={{ fontSize: 11, color: 'var(--erro)' }}>⚠ {j.erro}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: PRIORIDADE_COR[j.prioridade] }}>{PRIORIDADE_LABEL[j.prioridade]}</span>
                <span style={{ fontSize: 12, color: STATUS_JOB_COR[j.status] }}>{STATUS_JOB_LABEL[j.status]}</span>
                {j.status === 'FAILED' && <button onClick={() => handleRetry(j)} style={{ background: 'none', border: 'none', color: 'var(--dourado)', cursor: 'pointer', fontSize: 11.5 }}>Tentar de novo</button>}
                {j.status === 'PRINTED' && <button onClick={() => handleReimprimir(j)} style={{ background: 'none', border: 'none', color: 'var(--dourado)', cursor: 'pointer', fontSize: 11.5 }}>Reimprimir</button>}
                {!['PRINTED', 'CANCELLED'].includes(j.status) && <button onClick={() => handleCancelar(j)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 11.5 }}>Cancelar</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 2 && (
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Logs de auditoria</h3>
          {!logs.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum log ainda.</p>}
          {logs.map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borda)', fontSize: 12.5 }}>
              <div>
                <strong>{LOG_ACAO_LABEL[l.acao] || l.acao}</strong>
                <span style={{ color: 'var(--texto2)' }}> — {TIPO_DOCUMENTO_LABEL[l.printJob?.tipoDocumento]} · {l.printJob?.printer?.nome}</span>
                {l.detalhe && <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{l.detalhe}</div>}
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--texto2)' }}>
                {l.usuario?.nome && <div>{l.usuario.nome}</div>}
                <div>{new Date(l.criadoEm).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
