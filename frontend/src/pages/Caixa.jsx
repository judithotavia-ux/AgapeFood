import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as caixaService from '../services/caixaService';
import { fmtPreco, PAGAMENTO_LABEL } from '../utils/pedidoConstantes';

function CartaoStat({ label, valor, cor }) {
  return (
    <div className="card">
      <div style={{ fontSize: 20, fontWeight: 700, color: cor || 'var(--dourado)' }}>{fmtPreco(valor)}</div>
      <div style={{ fontSize: 12, color: 'var(--texto2)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function Caixa() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [valorAbertura, setValorAbertura] = useState('');
  const [obsAbertura, setObsAbertura] = useState('');
  const [erroAbertura, setErroAbertura] = useState('');

  const [modalMovimentacao, setModalMovimentacao] = useState(null); // 'SANGRIA' | 'SUPRIMENTO' | null
  const [valorMov, setValorMov] = useState('');
  const [motivoMov, setMotivoMov] = useState('');
  const [erroMov, setErroMov] = useState('');

  const [modalFechar, setModalFechar] = useState(false);
  const [valorFechamento, setValorFechamento] = useState('');
  const [obsFechamento, setObsFechamento] = useState('');
  const [erroFechar, setErroFechar] = useState('');
  const [resultadoFechamento, setResultadoFechamento] = useState(null);

  async function carregar() {
    setCarregando(true);
    const r = await caixaService.obterCaixaAtual();
    setDados(r);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function handleAbrir(e) {
    e.preventDefault();
    if (!valorAbertura || isNaN(Number(valorAbertura))) return setErroAbertura('Informe um valor válido.');
    setErroAbertura('');
    try {
      await caixaService.abrirCaixa({ valorAbertura: Number(valorAbertura), observacoes: obsAbertura || undefined });
      setValorAbertura(''); setObsAbertura('');
      await carregar();
    } catch (e) {
      setErroAbertura(e.response?.data?.erro || 'Não foi possível abrir o caixa.');
    }
  }

  function abrirModalMovimentacao(tipo) {
    setModalMovimentacao(tipo);
    setValorMov(''); setMotivoMov(''); setErroMov('');
  }

  async function handleSalvarMovimentacao(e) {
    e.preventDefault();
    if (!valorMov || isNaN(Number(valorMov)) || Number(valorMov) <= 0) return setErroMov('Informe um valor válido.');
    if (!motivoMov.trim()) return setErroMov('Informe o motivo.');
    try {
      const acao = modalMovimentacao === 'SANGRIA' ? caixaService.registrarSangria : caixaService.registrarSuprimento;
      await acao(dados.caixa.id, { valor: Number(valorMov), motivo: motivoMov });
      setModalMovimentacao(null);
      await carregar();
    } catch (e) {
      setErroMov(e.response?.data?.erro || 'Não foi possível registrar.');
    }
  }

  function abrirModalFechar() {
    setValorFechamento(''); setObsFechamento(''); setErroFechar(''); setResultadoFechamento(null);
    setModalFechar(true);
  }

  async function handleFechar(e) {
    e.preventDefault();
    if (!valorFechamento || isNaN(Number(valorFechamento))) return setErroFechar('Informe o valor contado.');
    try {
      const resultado = await caixaService.fecharCaixa(dados.caixa.id, { valorFechamento: Number(valorFechamento), observacoes: obsFechamento || undefined });
      setResultadoFechamento(resultado);
    } catch (e) {
      setErroFechar(e.response?.data?.erro || 'Não foi possível fechar o caixa.');
    }
  }

  function fecharModalFechamento() {
    setModalFechar(false);
    carregar();
  }

  if (carregando) return <AdminLayout titulo="Caixa"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;

  if (!dados?.aberto) {
    return (
      <AdminLayout titulo="Caixa">
        <div className="card" style={{ maxWidth: 420 }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>🔓 Abrir caixa</h3>
          <form onSubmit={handleAbrir}>
            <label>Valor inicial (troco/fundo de caixa)</label>
            <input type="number" step="0.01" min="0" value={valorAbertura} onChange={(e) => setValorAbertura(e.target.value)} placeholder="0.00" autoFocus />
            <label style={{ marginTop: 12 }}>Observações</label>
            <input value={obsAbertura} onChange={(e) => setObsAbertura(e.target.value)} placeholder="Opcional" />
            {erroAbertura && <div className="erro-msg">{erroAbertura}</div>}
            <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Abrir caixa</button>
          </form>
        </div>
      </AdminLayout>
    );
  }

  const { caixa, resumo } = dados;

  return (
    <AdminLayout titulo="Caixa">
      <div className="card" style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13 }}>🔓 Caixa aberto por <strong>{caixa.usuarioAbertura?.nome}</strong></div>
          <div style={{ fontSize: 12, color: 'var(--texto2)', marginTop: 2 }}>
            Desde {new Date(caixa.abertoEm).toLocaleString('pt-BR')} · Fundo inicial: {fmtPreco(caixa.valorAbertura)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/pedidos/novo" className="btn" style={{ textDecoration: 'none' }}>🛒 Novo pedido</Link>
          <button className="btn-outline" onClick={() => abrirModalMovimentacao('SANGRIA')}>− Sangria</button>
          <button className="btn-outline" onClick={() => abrirModalMovimentacao('SUPRIMENTO')}>+ Suprimento</button>
          <button className="btn" style={{ background: 'var(--erro)', borderColor: 'var(--erro)', color: '#fff' }} onClick={abrirModalFechar}>Fechar caixa</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, fontSize: 12.5, color: 'var(--texto2)' }}>
        💡 O <strong>Caixa</strong> controla o dinheiro (abertura, sangria, fechamento) — pra bater uma venda e passar os produtos (ou escanear código de barras), use <Link to="/pedidos/novo" style={{ color: 'var(--dourado)' }}>Novo pedido</Link>.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
        <CartaoStat label="Total de vendas" valor={resumo.totalVendas} />
        <CartaoStat label="Saldo esperado em dinheiro" valor={resumo.saldoDinheiroEsperado} />
        <CartaoStat label="Sangrias" valor={resumo.totalSangrias} cor="var(--erro)" />
        <CartaoStat label="Suprimentos" valor={resumo.totalSuprimentos} cor="var(--sucesso)" />
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h4 style={{ fontSize: 14, marginBottom: 12 }}>Vendas por forma de pagamento ({resumo.totalPedidos} pedido(s))</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {Object.entries(resumo.vendasPorFormaPagamento).map(([forma, valor]) => (
            <div key={forma}>
              <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{PAGAMENTO_LABEL[forma]}</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtPreco(valor)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h4 style={{ fontSize: 14, marginBottom: 12 }}>Movimentações do caixa</h4>
        {!resumo.movimentacoes.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma sangria ou suprimento registrado.</p>}
        {resumo.movimentacoes.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
            <div>
              <span style={{ color: m.tipo === 'SANGRIA' ? 'var(--erro)' : 'var(--sucesso)', fontWeight: 600 }}>
                {m.tipo === 'SANGRIA' ? '− Sangria' : '+ Suprimento'}
              </span>
              <span style={{ color: 'var(--texto2)', marginLeft: 8 }}>{m.motivo}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span>{fmtPreco(m.valor)}</span>
              <span style={{ color: 'var(--texto2)' }}>{new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal titulo={modalMovimentacao === 'SANGRIA' ? 'Registrar sangria' : 'Registrar suprimento'} aberto={!!modalMovimentacao} onFechar={() => setModalMovimentacao(null)} largura={380}>
        <form onSubmit={handleSalvarMovimentacao}>
          <label>Valor (R$)</label>
          <input type="number" step="0.01" min="0" value={valorMov} onChange={(e) => setValorMov(e.target.value)} placeholder="0.00" autoFocus />
          <label style={{ marginTop: 12 }}>Motivo</label>
          <input value={motivoMov} onChange={(e) => setMotivoMov(e.target.value)} placeholder={modalMovimentacao === 'SANGRIA' ? 'Ex: depósito no cofre' : 'Ex: troco adicional'} />
          {erroMov && <div className="erro-msg">{erroMov}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Confirmar</button>
        </form>
      </Modal>

      <Modal titulo="Fechar caixa" aberto={modalFechar} onFechar={fecharModalFechamento} largura={420}>
        {!resultadoFechamento ? (
          <form onSubmit={handleFechar}>
            <p style={{ fontSize: 12.5, color: 'var(--texto2)', marginBottom: 14 }}>
              Saldo esperado em dinheiro: <strong style={{ color: 'var(--texto)' }}>{fmtPreco(resumo.saldoDinheiroEsperado)}</strong>
            </p>
            <label>Valor contado na gaveta (R$)</label>
            <input type="number" step="0.01" min="0" value={valorFechamento} onChange={(e) => setValorFechamento(e.target.value)} placeholder="0.00" autoFocus />
            <label style={{ marginTop: 12 }}>Observações</label>
            <input value={obsFechamento} onChange={(e) => setObsFechamento(e.target.value)} placeholder="Opcional" />
            {erroFechar && <div className="erro-msg">{erroFechar}</div>}
            <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Confirmar fechamento</button>
          </form>
        ) : (
          <div>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Caixa fechado com sucesso.</p>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div>Saldo esperado: <strong>{fmtPreco(resultadoFechamento.resumo.saldoDinheiroEsperado)}</strong></div>
              <div>Valor contado: <strong>{fmtPreco(resultadoFechamento.caixa.valorFechamento)}</strong></div>
              <div>
                Diferença:{' '}
                <strong style={{ color: resultadoFechamento.diferenca === 0 ? 'var(--sucesso)' : (resultadoFechamento.diferenca > 0 ? 'var(--sucesso)' : 'var(--erro)') }}>
                  {resultadoFechamento.diferenca > 0 ? '+' : ''}{fmtPreco(resultadoFechamento.diferenca)}
                </strong>
              </div>
            </div>
            <button className="btn" style={{ width: '100%', marginTop: 18 }} onClick={fecharModalFechamento}>Fechar</button>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
