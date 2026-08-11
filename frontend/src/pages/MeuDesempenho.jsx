import { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import * as garcomService from '../services/garcomService';

function fmtPreco(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtData(iso) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';
}

function Cartao({ label, valor, sub, cor }) {
  return (
    <div className="card">
      <div style={{ fontSize: 22, fontWeight: 700, color: cor || 'var(--dourado)' }}>{valor}</div>
      <div style={{ fontSize: 12.5, color: 'var(--texto2)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--texto2)', opacity: .8, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function MeuDesempenho() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    garcomService.obterMeuDesempenho().then(setDados).finally(() => setCarregando(false));
  }, []);

  return (
    <AdminLayout titulo="Minhas Vendas e Gorjetas">
      <h2 style={{ marginBottom: 4 }}>Olá, {usuario?.nome?.split(' ')[0]}! 👋</h2>
      <p style={{ color: 'var(--texto2)', fontSize: 13.5, marginBottom: 22 }}>Seu desempenho e suas gorjetas, em tempo real.</p>

      {carregando || !dados ? (
        <div style={{ color: 'var(--texto2)' }}>Carregando…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
            <Cartao label="Vendas hoje" valor={fmtPreco(dados.vendasHoje)} sub={`${dados.pedidosHoje} pedido(s)`} />
            <Cartao label="Vendas no mês" valor={fmtPreco(dados.vendasMes)} sub={`${dados.pedidosMes} pedido(s)`} />
            <Cartao label="Mesas atendidas (mês)" valor={dados.mesasAtendidasMes} />
            <Cartao label="Ticket médio (mês)" valor={fmtPreco(dados.ticketMedioMes)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
            <Cartao label="Gorjeta gerada (mês)" valor={fmtPreco(dados.gorjetaGeradaMes)} sub="dos seus próprios pedidos" />
            <Cartao label="Gorjeta paga" valor={fmtPreco(dados.gorjetaPaga)} cor="var(--sucesso)" sub="já recebida" />
            <Cartao label="Gorjeta pendente" valor={fmtPreco(dados.gorjetaPendente)} cor="#e0a020" sub="aguardando pagamento" />
            <Cartao label="Último fechamento" valor={fmtData(dados.ultimoFechamento)} />
          </div>
        </>
      )}
    </AdminLayout>
  );
}
