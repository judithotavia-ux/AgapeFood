import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import BloqueioPlano from '../components/BloqueioPlano';
import * as estoqueService from '../services/estoqueService';
import * as cardapioService from '../services/cardapioService';
import { TIPO_MOVIMENTACAO_LABEL, TIPOS_ENTRADA, fmtQtd } from '../utils/estoqueConstantes';
import { fmtPreco } from '../utils/pedidoConstantes';

const ABAS = ['Visão geral', 'Movimentações', 'Lotes', 'Fornecedores'];

function CartaoStat({ label, valor, icone, alerta }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 26 }}>{icone}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: alerta ? 'var(--erro)' : 'var(--dourado)' }}>{valor}</div>
        <div style={{ fontSize: 12, color: 'var(--texto2)' }}>{label}</div>
      </div>
    </div>
  );
}

function GraficoMovimentacao({ dados }) {
  const max = Math.max(1, ...dados.map((d) => Math.max(d.entradas, d.saidas)));
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 15, marginBottom: 14 }}>Movimentações dos últimos 7 dias</h3>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', height: 140 }}>
        {dados.map((d) => (
          <div key={d.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 100 }}>
              <div title={`Entradas: ${d.entradas}`} style={{ width: 12, height: `${(d.entradas / max) * 100}%`, minHeight: d.entradas ? 3 : 0, background: 'var(--sucesso)', borderRadius: '3px 3px 0 0' }} />
              <div title={`Saídas: ${d.saidas}`} style={{ width: 12, height: `${(d.saidas / max) * 100}%`, minHeight: d.saidas ? 3 : 0, background: 'var(--erro)', borderRadius: '3px 3px 0 0' }} />
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--texto2)' }}>{d.dia.slice(5).split('-').reverse().join('/')}</div>
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

export default function Estoque() {
  const [aba, setAba] = useState(0);
  const [resumo, setResumo] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [planoAtual, setPlanoAtual] = useState(null);

  const [modalMov, setModalMov] = useState(false);
  const [produtoIdMov, setProdutoIdMov] = useState('');
  const [tipoMov, setTipoMov] = useState('ENTRADA');
  const [qtdMov, setQtdMov] = useState('');
  const [custoMov, setCustoMov] = useState('');
  const [motivoMov, setMotivoMov] = useState('');
  const [erroMov, setErroMov] = useState('');

  const [modalLote, setModalLote] = useState(false);
  const [produtoIdLote, setProdutoIdLote] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [qtdLote, setQtdLote] = useState('');
  const [custoLote, setCustoLote] = useState('');
  const [fornecedorIdLote, setFornecedorIdLote] = useState('');
  const [fabricacaoLote, setFabricacaoLote] = useState('');
  const [validadeLote, setValidadeLote] = useState('');
  const [erroLote, setErroLote] = useState('');

  const [modalFornecedor, setModalFornecedor] = useState({ aberto: false, fornecedor: null });
  const [nomeF, setNomeF] = useState('');
  const [cnpjCpfF, setCnpjCpfF] = useState('');
  const [telefoneF, setTelefoneF] = useState('');
  const [emailF, setEmailF] = useState('');
  const [contatoF, setContatoF] = useState('');
  const [enderecoF, setEnderecoF] = useState('');
  const [erroF, setErroF] = useState('');

  const produtosComControle = produtos.filter((p) => p.controlaEstoque);

  async function carregar() {
    setCarregando(true);
    try {
      const [r, m, l, f, p] = await Promise.all([
        estoqueService.obterResumoEstoque(),
        estoqueService.listarMovimentacoes(),
        estoqueService.listarLotes(),
        estoqueService.listarFornecedores(),
        cardapioService.listarProdutos()
      ]);
      setResumo(r); setMovimentacoes(m); setLotes(l); setFornecedores(f); setProdutos(p);
    } catch (e) {
      if (e.response?.data?.precisaUpgrade) { setBloqueado(true); setPlanoAtual(e.response.data.planoAtual); }
      else throw e;
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function abrirModalMov() {
    setProdutoIdMov(produtosComControle[0]?.id || '');
    setTipoMov('ENTRADA'); setQtdMov(''); setCustoMov(''); setMotivoMov(''); setErroMov('');
    setModalMov(true);
  }

  async function handleSalvarMov(e) {
    e.preventDefault();
    if (!produtoIdMov) return setErroMov('Selecione o produto.');
    if (qtdMov === '' || isNaN(Number(qtdMov))) return setErroMov('Informe a quantidade.');
    try {
      await estoqueService.criarMovimentacao({
        produtoId: produtoIdMov, tipo: tipoMov, quantidade: Number(qtdMov),
        custoUnitario: custoMov || undefined, motivo: motivoMov || undefined
      });
      setModalMov(false);
      await carregar();
    } catch (err) {
      setErroMov(err.response?.data?.erro || 'Não foi possível registrar a movimentação.');
    }
  }

  function abrirModalLote() {
    setProdutoIdLote(produtosComControle[0]?.id || '');
    setNumeroLote(''); setQtdLote(''); setCustoLote(''); setFornecedorIdLote(''); setFabricacaoLote(''); setValidadeLote(''); setErroLote('');
    setModalLote(true);
  }

  async function handleSalvarLote(e) {
    e.preventDefault();
    if (!produtoIdLote) return setErroLote('Selecione o produto.');
    if (!numeroLote.trim()) return setErroLote('Informe o número do lote.');
    if (!qtdLote || isNaN(Number(qtdLote)) || Number(qtdLote) <= 0) return setErroLote('Informe uma quantidade válida.');
    try {
      await estoqueService.criarLote({
        produtoId: produtoIdLote, numeroLote, quantidade: Number(qtdLote),
        custoUnitario: custoLote || undefined, fornecedorId: fornecedorIdLote || undefined,
        dataFabricacao: fabricacaoLote || undefined, dataValidade: validadeLote || undefined
      });
      setModalLote(false);
      await carregar();
    } catch (err) {
      setErroLote(err.response?.data?.erro || 'Não foi possível registrar o lote.');
    }
  }

  function abrirModalFornecedor(fornecedor = null) {
    setModalFornecedor({ aberto: true, fornecedor });
    setNomeF(fornecedor?.nome || ''); setCnpjCpfF(fornecedor?.cnpjCpf || ''); setTelefoneF(fornecedor?.telefone || '');
    setEmailF(fornecedor?.email || ''); setContatoF(fornecedor?.contato || ''); setEnderecoF(fornecedor?.endereco || '');
    setErroF('');
  }

  async function handleSalvarFornecedor(e) {
    e.preventDefault();
    if (!nomeF.trim()) return setErroF('Informe o nome do fornecedor.');
    try {
      const dados = { nome: nomeF, cnpjCpf: cnpjCpfF || undefined, telefone: telefoneF || undefined, email: emailF || undefined, contato: contatoF || undefined, endereco: enderecoF || undefined };
      if (modalFornecedor.fornecedor) await estoqueService.atualizarFornecedor(modalFornecedor.fornecedor.id, dados);
      else await estoqueService.criarFornecedor(dados);
      setModalFornecedor({ aberto: false, fornecedor: null });
      await carregar();
    } catch (err) {
      setErroF(err.response?.data?.erro || 'Não foi possível salvar o fornecedor.');
    }
  }

  async function excluirFornecedor(id) {
    if (!confirm('Excluir esse fornecedor?')) return;
    await estoqueService.excluirFornecedor(id);
    carregar();
  }

  if (carregando) return <AdminLayout titulo="Estoque"><p style={{ color: 'var(--texto2)' }}>Carregando…</p></AdminLayout>;
  if (bloqueado) return <AdminLayout titulo="Estoque"><BloqueioPlano planoAtual={planoAtual} /></AdminLayout>;

  return (
    <AdminLayout titulo="Estoque">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 18 }}>
        <CartaoStat label="Valor em estoque" valor={fmtPreco(resumo.valorTotalEstoque)} icone="💰" />
        <CartaoStat label="Produtos controlados" valor={resumo.produtosCadastrados} icone="📦" />
        <CartaoStat label="Estoque baixo" valor={resumo.produtosEstoqueBaixo.length} icone="⚠️" alerta={resumo.produtosEstoqueBaixo.length > 0} />
        <CartaoStat label="Lotes vencendo (7 dias)" valor={resumo.lotesProximosVencer.length} icone="⏳" alerta={resumo.lotesProximosVencer.length > 0} />
        <CartaoStat label="Lotes vencidos" valor={resumo.lotesVencidos.length} icone="❌" alerta={resumo.lotesVencidos.length > 0} />
      </div>

      <GraficoMovimentacao dados={resumo.grafico} />

      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--borda)' }}>
        {ABAS.map((a, i) => (
          <button
            key={a}
            onClick={() => setAba(i)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: 13,
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
          {resumo.produtosEstoqueBaixo.length > 0 && (
            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, marginBottom: 12, color: 'var(--erro)' }}>⚠️ Produtos com estoque baixo</h3>
              {resumo.produtosEstoqueBaixo.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
                  <span>{p.nome}</span>
                  <span style={{ color: 'var(--erro)' }}>{fmtQtd(p.estoqueAtual, p.unidade)} (mín. {fmtQtd(p.estoqueMinimo, p.unidade)})</span>
                </div>
              ))}
            </div>
          )}

          {(resumo.lotesVencidos.length > 0 || resumo.lotesProximosVencer.length > 0) && (
            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Validade de lotes</h3>
              {resumo.lotesVencidos.map((l) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
                  <span>{l.produto.nome} · lote {l.numeroLote}</span>
                  <span style={{ color: 'var(--erro)' }}>Vencido em {new Date(l.dataValidade).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
              {resumo.lotesProximosVencer.map((l) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
                  <span>{l.produto.nome} · lote {l.numeroLote}</span>
                  <span style={{ color: '#e0a020' }}>Vence em {new Date(l.dataValidade).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}

          {resumo.produtosSemMovimentacao.length > 0 && (
            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Sem movimentação nos últimos 30 dias</h3>
              {resumo.produtosSemMovimentacao.map((p) => (
                <div key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--borda)', fontSize: 13, color: 'var(--texto2)' }}>{p.nome}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Últimas entradas</h3>
              {!resumo.ultimasEntradas.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma entrada registrada.</p>}
              {resumo.ultimasEntradas.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)', fontSize: 12.5 }}>
                  <span>{m.produto.nome}</span>
                  <span style={{ color: 'var(--sucesso)' }}>+{fmtQtd(m.quantidade, m.produto.unidade)}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Últimas saídas</h3>
              {!resumo.ultimasSaidas.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma saída registrada.</p>}
              {resumo.ultimasSaidas.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--borda)', fontSize: 12.5 }}>
                  <span>{m.produto.nome}</span>
                  <span style={{ color: 'var(--erro)' }}>{fmtQtd(m.quantidade, m.produto.unidade)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {aba === 1 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Movimentações</h3>
            <button className="btn" onClick={abrirModalMov} disabled={!produtosComControle.length}>+ Movimentação</button>
          </div>
          {!produtosComControle.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)', marginBottom: 10 }}>Ative "Controla estoque" em ao menos um produto do cardápio para começar a movimentar.</p>}
          {!movimentacoes.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma movimentação registrada.</p>}
          {movimentacoes.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borda)', fontSize: 12.5 }}>
              <div>
                <strong>{m.produto.nome}</strong>
                <div style={{ color: 'var(--texto2)', fontSize: 11 }}>{TIPO_MOVIMENTACAO_LABEL[m.tipo] || m.tipo}{m.motivo ? ` · ${m.motivo}` : ''} · {m.usuario?.nome}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: Number(m.quantidade) >= 0 ? 'var(--sucesso)' : 'var(--erro)' }}>{Number(m.quantidade) >= 0 ? '+' : ''}{fmtQtd(m.quantidade, m.produto.unidade)}</div>
                <div style={{ color: 'var(--texto2)', fontSize: 10.5 }}>{new Date(m.criadoEm).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 2 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Lotes</h3>
            <button className="btn" onClick={abrirModalLote} disabled={!produtosComControle.length}>+ Lote</button>
          </div>
          {!lotes.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum lote cadastrado.</p>}
          {lotes.map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borda)', fontSize: 12.5 }}>
              <div>
                <strong>{l.produto.nome}</strong> — lote {l.numeroLote}
                <div style={{ color: 'var(--texto2)', fontSize: 11 }}>{l.fornecedor?.nome || 'Sem fornecedor'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{fmtQtd(l.quantidade, l.produto.unidade)}</div>
                <div style={{ color: 'var(--texto2)', fontSize: 10.5 }}>{l.dataValidade ? `Val: ${new Date(l.dataValidade).toLocaleDateString('pt-BR')}` : 'Sem validade'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === 3 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Fornecedores</h3>
            <button className="btn" onClick={() => abrirModalFornecedor()}>+ Fornecedor</button>
          </div>
          {!fornecedores.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum fornecedor cadastrado.</p>}
          {fornecedores.map((f) => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--borda)' }}>
              <div>
                <strong style={{ fontSize: 13 }}>{f.nome}</strong>
                <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>{f.telefone || '—'}{f.email ? ` · ${f.email}` : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={() => abrirModalFornecedor(f)} style={{ background: 'none', border: 'none', color: 'var(--dourado)', cursor: 'pointer', fontSize: 12 }}>Editar</button>
                <button onClick={() => excluirFornecedor(f.id)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal titulo="Nova movimentação" aberto={modalMov} onFechar={() => setModalMov(false)} largura={420}>
        <form onSubmit={handleSalvarMov}>
          <label>Produto</label>
          <select value={produtoIdMov} onChange={(e) => setProdutoIdMov(e.target.value)}>
            {produtosComControle.map((p) => <option key={p.id} value={p.id}>{p.nome} ({fmtQtd(p.estoqueAtual, p.unidade)} em estoque)</option>)}
          </select>
          <label style={{ marginTop: 12 }}>Tipo</label>
          <select value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}>
            {Object.entries(TIPO_MOVIMENTACAO_LABEL).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
          </select>
          <label style={{ marginTop: 12 }}>
            {tipoMov === 'INVENTARIO' ? 'Nova quantidade total (recontagem)' : tipoMov === 'AJUSTE' ? 'Ajuste (use negativo para reduzir)' : 'Quantidade'}
          </label>
          <input type="number" step="0.001" value={qtdMov} onChange={(e) => setQtdMov(e.target.value)} />
          {TIPOS_ENTRADA.includes(tipoMov) && (
            <>
              <label style={{ marginTop: 12 }}>Custo unitário (R$)</label>
              <input type="number" step="0.01" min="0" value={custoMov} onChange={(e) => setCustoMov(e.target.value)} placeholder="Opcional" />
            </>
          )}
          <label style={{ marginTop: 12 }}>Motivo</label>
          <input value={motivoMov} onChange={(e) => setMotivoMov(e.target.value)} placeholder="Opcional" />
          {erroMov && <div className="erro-msg">{erroMov}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Registrar</button>
        </form>
      </Modal>

      <Modal titulo="Novo lote" aberto={modalLote} onFechar={() => setModalLote(false)} largura={420}>
        <form onSubmit={handleSalvarLote}>
          <label>Produto</label>
          <select value={produtoIdLote} onChange={(e) => setProdutoIdLote(e.target.value)}>
            {produtosComControle.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <label style={{ marginTop: 12 }}>Número do lote</label>
          <input value={numeroLote} onChange={(e) => setNumeroLote(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Quantidade recebida</label>
              <input type="number" step="0.001" min="0" value={qtdLote} onChange={(e) => setQtdLote(e.target.value)} />
            </div>
            <div>
              <label>Custo unitário (R$)</label>
              <input type="number" step="0.01" min="0" value={custoLote} onChange={(e) => setCustoLote(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <label style={{ marginTop: 12 }}>Fornecedor</label>
          <select value={fornecedorIdLote} onChange={(e) => setFornecedorIdLote(e.target.value)}>
            <option value="">Sem fornecedor</option>
            {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Fabricação</label>
              <input type="date" value={fabricacaoLote} onChange={(e) => setFabricacaoLote(e.target.value)} />
            </div>
            <div>
              <label>Validade</label>
              <input type="date" value={validadeLote} onChange={(e) => setValidadeLote(e.target.value)} />
            </div>
          </div>
          {erroLote && <div className="erro-msg">{erroLote}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Receber lote</button>
        </form>
      </Modal>

      <Modal titulo={modalFornecedor.fornecedor ? 'Editar fornecedor' : 'Novo fornecedor'} aberto={modalFornecedor.aberto} onFechar={() => setModalFornecedor({ aberto: false, fornecedor: null })} largura={420}>
        <form onSubmit={handleSalvarFornecedor}>
          <label>Nome</label>
          <input value={nomeF} onChange={(e) => setNomeF(e.target.value)} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>CNPJ/CPF</label>
              <input value={cnpjCpfF} onChange={(e) => setCnpjCpfF(e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <label>Telefone</label>
              <input value={telefoneF} onChange={(e) => setTelefoneF(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <label style={{ marginTop: 12 }}>E-mail</label>
          <input value={emailF} onChange={(e) => setEmailF(e.target.value)} placeholder="Opcional" />
          <label style={{ marginTop: 12 }}>Pessoa de contato</label>
          <input value={contatoF} onChange={(e) => setContatoF(e.target.value)} placeholder="Opcional" />
          <label style={{ marginTop: 12 }}>Endereço</label>
          <input value={enderecoF} onChange={(e) => setEnderecoF(e.target.value)} placeholder="Opcional" />
          {erroF && <div className="erro-msg">{erroF}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Salvar</button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
