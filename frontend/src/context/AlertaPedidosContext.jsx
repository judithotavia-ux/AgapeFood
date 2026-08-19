import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { obterSocket } from '../services/socket';
import {
  tocarAlertaNovoPedido, tocarAlertaCancelamento,
  iniciarRepeticao, pararRepeticao, pararTodasRepeticoes, notificarNovoPedido
} from '../utils/alertas';

const STATUS_ATIVOS = ['RECEBIDO', 'PREPARANDO', 'PRONTO', 'SAIU_PARA_ENTREGA'];

const AlertaPedidosContext = createContext(null);

// Fica montado uma unica vez, fora das rotas - assim o alarme de pedido novo toca em qualquer
// tela (Caixa, Cardapio, Cozinha etc.), nao so na Central de Pedidos. A origem do pedido nao
// importa aqui: cardapio digital, mesa/salao (painel) e o que a Agape IA cria (ex: Instagram/
// WhatsApp relatado manualmente) passam todos pelo mesmo evento de socket "pedido:novo".
export function AlertaPedidosProvider({ children }) {
  const { usuario } = useAuth();
  const [naoReconhecidos, setNaoReconhecidos] = useState([]);
  const naoReconhecidosRef = useRef([]);
  const empresaId = usuario?.empresa?.id;

  useEffect(() => {
    if (!empresaId) {
      pararTodasRepeticoes();
      naoReconhecidosRef.current = [];
      setNaoReconhecidos([]);
      return;
    }

    const socket = obterSocket();
    if (!socket) return;

    function aoReceberNovo(pedido) {
      naoReconhecidosRef.current = [...naoReconhecidosRef.current, pedido];
      setNaoReconhecidos(naoReconhecidosRef.current);
      iniciarRepeticao(pedido.id, tocarAlertaNovoPedido, 15000);
      notificarNovoPedido(pedido, pedido.tipo);
    }

    function aoAtualizar(pedidoAtualizado) {
      if (pedidoAtualizado.status === 'CANCELADO') tocarAlertaCancelamento();
      if (!STATUS_ATIVOS.includes(pedidoAtualizado.status)) {
        pararRepeticao(pedidoAtualizado.id);
        naoReconhecidosRef.current = naoReconhecidosRef.current.filter((p) => p.id !== pedidoAtualizado.id);
        setNaoReconhecidos(naoReconhecidosRef.current);
      }
    }

    socket.on('pedido:novo', aoReceberNovo);
    socket.on('pedido:atualizado', aoAtualizar);

    return () => {
      socket.off('pedido:novo', aoReceberNovo);
      socket.off('pedido:atualizado', aoAtualizar);
    };
  }, [empresaId]);

  function reconhecer(id) {
    pararRepeticao(id);
    naoReconhecidosRef.current = naoReconhecidosRef.current.filter((p) => p.id !== id);
    setNaoReconhecidos(naoReconhecidosRef.current);
  }

  function reconhecerTodos() {
    naoReconhecidosRef.current.forEach((p) => pararRepeticao(p.id));
    naoReconhecidosRef.current = [];
    setNaoReconhecidos([]);
  }

  return (
    <AlertaPedidosContext.Provider value={{ naoReconhecidos, reconhecer, reconhecerTodos }}>
      {children}
      <FaixaAlertaPedidos naoReconhecidos={naoReconhecidos} />
    </AlertaPedidosContext.Provider>
  );
}

export function useAlertaPedidos() {
  const ctx = useContext(AlertaPedidosContext);
  if (!ctx) throw new Error('useAlertaPedidos precisa estar dentro de um AlertaPedidosProvider');
  return ctx;
}

// A Central de Pedidos ja mostra e trata cada pedido novo individualmente - a faixa flutuante so
// aparece nas outras telas, pra nao duplicar o mesmo aviso.
function FaixaAlertaPedidos({ naoReconhecidos }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (naoReconhecidos.length === 0 || location.pathname === '/central-pedidos') return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      background: '#7a1f1f', color: '#fff', padding: '14px 18px', borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 14,
      maxWidth: 320, animation: 'agapePulsarAlerta 1s infinite'
    }}>
      <style>{'@keyframes agapePulsarAlerta { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }'}</style>
      <span style={{ fontSize: 22 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>
          {naoReconhecidos.length} pedido{naoReconhecidos.length > 1 ? 's' : ''} novo{naoReconhecidos.length > 1 ? 's' : ''}!
        </div>
        <div style={{ fontSize: 11.5, opacity: .85 }}>Cardápio digital, mesa, salão ou manual</div>
      </div>
      <button
        onClick={() => navigate('/central-pedidos')}
        style={{ background: '#fff', color: '#7a1f1f', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        Ver
      </button>
    </div>
  );
}
