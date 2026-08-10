import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import * as agapeIaService from '../services/agapeIaService';

const TIPO_ACAO_LABEL = {
  PERGUNTA_RESPONDIDA: 'Pergunta respondida',
  PEDIDO_CRIADO: 'Pedido criado',
  PROMOCAO_CRIADA: 'Promoção criada',
  CAMPANHA_CRIADA: 'Campanha criada',
  RELATORIO_GERADO: 'Relatório gerado',
  TAREFA_CRIADA: 'Tarefa criada'
};

const TIPO_ACAO_ICONE = {
  PERGUNTA_RESPONDIDA: '💬',
  PEDIDO_CRIADO: '🛒',
  PROMOCAO_CRIADA: '🏷️',
  CAMPANHA_CRIADA: '📣',
  RELATORIO_GERADO: '📄',
  TAREFA_CRIADA: '✅'
};

function fmtData(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtPreco(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CartaoMetrica({ icone, label, valor, sublabel }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 22 }}>{icone}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--dourado)' }}>{valor}</div>
      <div style={{ fontSize: 12.5, color: 'var(--texto2)' }}>{label}</div>
      {sublabel && <div style={{ fontSize: 11, color: 'var(--texto2)', opacity: 0.75 }}>{sublabel}</div>}
    </div>
  );
}

export default function AgapeIADashboard() {
  const [dados, setDados] = useState(null);
  const [dias, setDias] = useState(30);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const d = await agapeIaService.obterDashboardIA(dias);
    setDados(d);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [dias]);

  async function concluirTarefa(id) {
    await agapeIaService.atualizarTarefaIA(id, 'CONCLUIDA');
    carregar();
  }

  if (carregando || !dados) {
    return (
      <AdminLayout titulo="Ágape IA · Dashboard">
        <div style={{ color: 'var(--texto2)' }}>Carregando…</div>
      </AdminLayout>
    );
  }

  const horas = Math.floor(dados.tempoEconomizadoMinutos / 60);
  const minutosRestantes = dados.tempoEconomizadoMinutos % 60;

  return (
    <AdminLayout titulo="Ágape IA · Dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <Link to="/agape-ia" style={{ fontSize: 13, textDecoration: 'underline' }}>← Voltar para o chat</Link>
        <select value={dias} onChange={(e) => setDias(Number(e.target.value))} style={{ width: 160 }}>
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 22 }}>
        <CartaoMetrica icone="💬" label="Perguntas Respondidas" valor={dados.perguntasRespondidas} />
        <CartaoMetrica icone="🛒" label="Pedidos Criados" valor={dados.pedidosCriados} />
        <CartaoMetrica icone="🏷️" label="Promoções Criadas" valor={dados.promocoesCriadas} />
        <CartaoMetrica icone="🧑‍🤝‍🧑" label="Clientes Atendidos" valor={dados.clientesAtendidos} />
        <CartaoMetrica icone="⏱️" label="Tempo Economizado" valor={horas > 0 ? `${horas}h ${minutosRestantes}min` : `${minutosRestantes}min`} sublabel="estimativa" />
        <CartaoMetrica icone="💰" label="Economia Gerada" valor={fmtPreco(dados.economiaGerada)} sublabel="estimativa" />
      </div>

      <div className="erro-msg" style={{ background: 'rgba(212,175,55,.08)', borderColor: 'var(--borda)', color: 'var(--texto2)', marginBottom: 22 }}>
        ⓘ {dados.estimativa.aviso} Considera {dados.estimativa.minutosPorPergunta} min por pergunta respondida, {dados.estimativa.minutosPorAcao} min por ação executada, e {fmtPreco(dados.estimativa.custoHoraAtendimento)}/hora de atendimento.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Atividade recente</h3>
          {dados.ultimasAcoes.length === 0 && <div style={{ fontSize: 13, color: 'var(--texto2)' }}>Nenhuma atividade no período.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dados.ultimasAcoes.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, borderBottom: '1px solid var(--borda)', paddingBottom: 10 }}>
                <span>{TIPO_ACAO_ICONE[a.tipo] || '•'}</span>
                <div style={{ flex: 1 }}>
                  <div>{TIPO_ACAO_LABEL[a.tipo] || a.tipo}{a.detalhe ? ` — ${a.detalhe.length > 60 ? a.detalhe.slice(0, 60) + '…' : a.detalhe}` : ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--texto2)' }}>{fmtData(a.criadoEm)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Tarefas geradas pela IA</h3>
          {dados.tarefasPendentes.length === 0 && <div style={{ fontSize: 13, color: 'var(--texto2)' }}>Nenhuma tarefa pendente.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dados.tarefasPendentes.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, borderBottom: '1px solid var(--borda)', paddingBottom: 10 }}>
                <input type="checkbox" checked={false} onChange={() => concluirTarefa(t.id)} style={{ width: 'auto', marginTop: 3 }} />
                <div>
                  <div>{t.titulo}</div>
                  {t.descricao && <div style={{ fontSize: 11.5, color: 'var(--texto2)' }}>{t.descricao}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
