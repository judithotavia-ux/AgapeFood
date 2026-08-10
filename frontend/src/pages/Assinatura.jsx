import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as assinaturaService from '../services/assinaturaService';
import {
  STATUS_ASSINATURA_LABEL, STATUS_ASSINATURA_COR, CICLO_LABEL, FORMA_PAGAMENTO_ASSINATURA_LABEL, fmtPrecoAssinatura
} from '../utils/assinaturaConstantes';

export default function Assinatura() {
  const [assinatura, setAssinatura] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [modalAssinar, setModalAssinar] = useState(false);
  const [planoEscolhido, setPlanoEscolhido] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const [a, p] = await Promise.all([assinaturaService.obterMinhaAssinatura(), assinaturaService.listarPlanos()]);
    setAssinatura(a);
    setPlanos(p);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirModalAssinar(plano) {
    setPlanoEscolhido(plano);
    setFormaPagamento('PIX');
    setCpfCnpj('');
    setErro('');
    setModalAssinar(true);
  }

  async function handleAssinar(e) {
    e.preventDefault();
    if (!cpfCnpj.trim()) return setErro('Informe o CPF ou CNPJ para a cobrança.');
    setEnviando(true);
    setErro('');
    try {
      await assinaturaService.assinarPlano({ planoId: planoEscolhido.id, formaPagamento, cpfCnpj });
      setModalAssinar(false);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível processar a assinatura.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleCancelar() {
    if (!confirm('Cancelar sua assinatura? Você perderá o acesso ao sistema ao final do período atual.')) return;
    await assinaturaService.cancelarAssinatura('Cancelado pelo usuário no painel.');
    carregar();
  }

  if (carregando || !assinatura) return <AdminLayout titulo="Assinatura"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;

  const semAssinatura = !assinatura.id;

  return (
    <AdminLayout titulo="Assinatura">
      {!assinatura.pagamentoConfigurado && (
        <div className="card" style={{ marginBottom: 18, borderColor: 'var(--dourado)', fontSize: 12.5 }}>
          ℹ️ A cobrança automática ainda não foi configurada nesta instalação do AgapeFood. Você pode navegar pelos
          planos, mas a confirmação de pagamento depende da configuração do administrador do sistema.
        </div>
      )}

      {!semAssinatura && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{assinatura.plano?.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--texto2)' }}>{fmtPrecoAssinatura(assinatura.plano?.preco)}{CICLO_LABEL[assinatura.plano?.ciclo]}</div>
            </div>
            <span style={{ fontSize: 13, color: STATUS_ASSINATURA_COR[assinatura.status] }}>● {STATUS_ASSINATURA_LABEL[assinatura.status]}</span>
          </div>

          {assinatura.status === 'TRIAL' && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--texto2)' }}>
              {assinatura.diasRestantesTrial > 0
                ? `Faltam ${assinatura.diasRestantesTrial} dia(s) do seu período de teste gratuito.`
                : 'Seu período de teste terminou. Assine um plano para continuar usando o sistema.'}
            </div>
          )}
          {assinatura.status === 'INADIMPLENTE' && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--erro)' }}>
              ⚠ Identificamos um pagamento em atraso. Regularize para não perder o acesso.
            </div>
          )}
          {assinatura.status === 'CANCELADA' && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--texto2)' }}>Sua assinatura está cancelada. Escolha um plano abaixo para reativar.</div>
          )}

          {['ATIVA', 'INADIMPLENTE'].includes(assinatura.status) && (
            <button onClick={handleCancelar} style={{ background: 'none', border: 'none', color: 'var(--erro)', fontSize: 12, cursor: 'pointer', marginTop: 12 }}>
              Cancelar assinatura
            </button>
          )}
        </div>
      )}

      <h3 style={{ fontSize: 14, color: 'var(--texto2)', marginBottom: 12 }}>Planos disponíveis</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {planos.map((p) => {
          const atual = assinatura.planoId === p.id && !['CANCELADA'].includes(assinatura.status);
          return (
            <div key={p.id} className="card" style={{ borderColor: atual ? 'var(--dourado)' : undefined }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{p.nome}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--dourado)', marginBottom: 6 }}>
                {fmtPrecoAssinatura(p.preco)}<span style={{ fontSize: 12, color: 'var(--texto2)', fontWeight: 400 }}>{CICLO_LABEL[p.ciclo]}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--texto2)', minHeight: 40 }}>{p.descricao}</p>
              {atual
                ? <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--dourado)', marginTop: 10 }}>✓ Plano atual</div>
                : <button className="btn" style={{ width: '100%', marginTop: 10 }} onClick={() => abrirModalAssinar(p)}>Assinar</button>}
            </div>
          );
        })}
      </div>

      {assinatura.cobrancas?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Histórico de cobranças</h3>
          {assinatura.cobrancas.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
              <div>
                <span>{fmtPrecoAssinatura(c.valor)}</span>
                <div style={{ fontSize: 11, color: 'var(--texto2)' }}>Vencimento: {new Date(c.vencimento).toLocaleDateString('pt-BR')}{c.formaPagamento ? ` · ${FORMA_PAGAMENTO_ASSINATURA_LABEL[c.formaPagamento]}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{c.status}</div>
                {c.linkPagamento && <a href={c.linkPagamento} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--dourado)' }}>Ver cobrança</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal titulo={`Assinar ${planoEscolhido?.nome || ''}`} aberto={modalAssinar} onFechar={() => setModalAssinar(false)} largura={400}>
        <form onSubmit={handleAssinar}>
          <label>CPF ou CNPJ (para a cobrança)</label>
          <input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} autoFocus placeholder="Somente números" />
          <label style={{ marginTop: 12 }}>Forma de pagamento</label>
          <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option value="PIX">Pix</option>
            <option value="BOLETO">Boleto</option>
            <option value="CARTAO">Cartão de crédito</option>
          </select>
          {erro && <div className="erro-msg">{erro}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }} disabled={enviando}>
            {enviando ? 'Processando…' : 'Confirmar assinatura'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
