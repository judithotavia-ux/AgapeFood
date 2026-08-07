import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import AdminLayout from '../layouts/AdminLayout';
import Modal from '../components/Modal';
import * as mesaService from '../services/mesaService';
import * as reservaService from '../services/reservaService';
import { useAuth } from '../context/AuthContext';
import { fmtPreco } from '../utils/pedidoConstantes';

function CartaoMesa({ mesa, onClick }) {
  const ocupada = mesa.status === 'OCUPADA';
  return (
    <button
      onClick={onClick}
      className="card"
      style={{
        textAlign: 'center', cursor: 'pointer', padding: 18,
        border: `2px solid ${ocupada ? 'var(--dourado)' : 'var(--sucesso)'}`
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color: ocupada ? 'var(--dourado)' : 'var(--sucesso)' }}>Mesa {mesa.numero}</div>
      <div style={{ fontSize: 11, color: 'var(--texto2)', marginTop: 4 }}>👥 até {mesa.capacidade}</div>
      <div style={{ fontSize: 11, marginTop: 8, fontWeight: 600, color: ocupada ? 'var(--dourado)' : 'var(--sucesso)' }}>
        {ocupada ? `Ocupada — ${fmtPreco(mesa.totalComanda)}` : 'Livre'}
      </div>
    </button>
  );
}

export default function Salao() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mesas, setMesas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState(location.state?.pedidoCriado ? `Pedido #${location.state.pedidoCriado} lançado na comanda!` : '');

  const [modalNovaMesa, setModalNovaMesa] = useState(false);
  const [numeroMesa, setNumeroMesa] = useState('');
  const [capacidadeMesa, setCapacidadeMesa] = useState('4');
  const [erroMesa, setErroMesa] = useState('');

  const [mesaSelecionada, setMesaSelecionada] = useState(null);
  const [comanda, setComanda] = useState(null);
  const [modoTransferir, setModoTransferir] = useState(false);
  const [mesaDestino, setMesaDestino] = useState('');
  const [pessoasDividir, setPessoasDividir] = useState('2');
  const [erroComanda, setErroComanda] = useState('');

  const [modalQr, setModalQr] = useState(null);

  const [modalReserva, setModalReserva] = useState(false);
  const [resNome, setResNome] = useState('');
  const [resTelefone, setResTelefone] = useState('');
  const [resDataHora, setResDataHora] = useState('');
  const [resPessoas, setResPessoas] = useState('2');
  const [resMesaId, setResMesaId] = useState('');
  const [erroReserva, setErroReserva] = useState('');

  async function carregar() {
    setCarregando(true);
    const [listaMesas, listaReservas] = await Promise.all([
      mesaService.listarMesas(),
      reservaService.listarReservas({ status: 'CONFIRMADA' })
    ]);
    setMesas(listaMesas);
    setReservas(listaReservas);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  async function handleCriarMesa(e) {
    e.preventDefault();
    if (!numeroMesa) return setErroMesa('Informe o número da mesa.');
    setErroMesa('');
    try {
      await mesaService.criarMesa({ numero: Number(numeroMesa), capacidade: Number(capacidadeMesa) || 4 });
      setNumeroMesa(''); setCapacidadeMesa('4');
      setModalNovaMesa(false);
      await carregar();
    } catch (e) {
      setErroMesa(e.response?.data?.erro || 'Não foi possível criar a mesa.');
    }
  }

  async function abrirMesa(mesa) {
    if (mesa.status === 'LIVRE') {
      navigate('/pedidos/novo', { state: { mesaId: mesa.id } });
      return;
    }
    setMesaSelecionada(mesa);
    setModoTransferir(false);
    setErroComanda('');
    const dados = await mesaService.obterComanda(mesa.id);
    setComanda(dados);
  }

  function fecharComanda() {
    setMesaSelecionada(null);
    setComanda(null);
  }

  async function handleTransferir() {
    if (!mesaDestino) return setErroComanda('Selecione a mesa de destino.');
    try {
      await mesaService.transferirMesa(mesaSelecionada.id, mesaDestino);
      fecharComanda();
      await carregar();
    } catch (e) {
      setErroComanda(e.response?.data?.erro || 'Não foi possível transferir.');
    }
  }

  async function handleFecharMesa() {
    if (!confirm(`Fechar a conta da Mesa ${mesaSelecionada.numero}? Isso libera a mesa.`)) return;
    await mesaService.fecharMesa(mesaSelecionada.id);
    fecharComanda();
    await carregar();
  }

  async function handleCriarReserva(e) {
    e.preventDefault();
    if (!resNome.trim()) return setErroReserva('Informe o nome do cliente.');
    if (!resDataHora) return setErroReserva('Informe a data e hora.');
    setErroReserva('');
    try {
      await reservaService.criarReserva({
        clienteNome: resNome, clienteTelefone: resTelefone || undefined,
        dataHora: resDataHora, pessoas: Number(resPessoas) || 1, mesaId: resMesaId || undefined
      });
      setResNome(''); setResTelefone(''); setResDataHora(''); setResPessoas('2'); setResMesaId('');
      setModalReserva(false);
      await carregar();
    } catch (e) {
      setErroReserva(e.response?.data?.erro || 'Não foi possível criar a reserva.');
    }
  }

  async function cancelarReserva(id) {
    if (!confirm('Cancelar essa reserva?')) return;
    await reservaService.atualizarStatusReserva(id, 'CANCELADA');
    carregar();
  }

  const mesasLivres = mesas.filter((m) => m.status === 'LIVRE' && (!mesaSelecionada || m.id !== mesaSelecionada.id));
  const valorPorPessoa = comanda && Number(pessoasDividir) > 0 ? comanda.total / Number(pessoasDividir) : 0;

  return (
    <AdminLayout titulo="Salão">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--texto2)' }}>
          <span>🟢 Livre</span>
          <span>🟡 Ocupada</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" onClick={() => setModalReserva(true)}>+ Reserva</button>
          <button className="btn" onClick={() => setModalNovaMesa(true)}>+ Mesa</button>
        </div>
      </div>

      {aviso && <div className="card" style={{ borderColor: 'var(--sucesso)', color: 'var(--sucesso)', marginBottom: 14, fontSize: 13 }}>✓ {aviso}</div>}

      {carregando && <p style={{ color: 'var(--texto2)' }}>Carregando…</p>}

      {!carregando && !mesas.length && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--texto2)' }}>Nenhuma mesa cadastrada. Clique em <strong>+ Mesa</strong>.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginBottom: 26 }}>
        {mesas.map((m) => (
          <div key={m.id} style={{ position: 'relative' }}>
            <CartaoMesa mesa={m} onClick={() => abrirMesa(m)} />
            <button
              onClick={(e) => { e.stopPropagation(); setModalQr(m); }}
              title="QR Code da mesa"
              style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              🔗
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>📅 Próximas reservas</h3>
        {!reservas.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhuma reserva confirmada.</p>}
        {reservas.map((r) => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--borda)', fontSize: 13 }}>
            <div>
              <strong>{r.clienteNome}</strong> · {r.pessoas} pessoa(s){r.mesa ? ` · Mesa ${r.mesa.numero}` : ''}
              {r.clienteTelefone && <span style={{ color: 'var(--texto2)' }}> · {r.clienteTelefone}</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ color: 'var(--texto2)' }}>{new Date(r.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <button onClick={() => cancelarReserva(r.id)} style={{ background: 'none', border: 'none', color: 'var(--erro)', cursor: 'pointer', fontSize: 12 }}>Cancelar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal nova mesa */}
      <Modal titulo="Nova mesa" aberto={modalNovaMesa} onFechar={() => setModalNovaMesa(false)} largura={340}>
        <form onSubmit={handleCriarMesa}>
          <label>Número da mesa</label>
          <input type="number" min="1" value={numeroMesa} onChange={(e) => setNumeroMesa(e.target.value)} autoFocus />
          <label style={{ marginTop: 12 }}>Capacidade (pessoas)</label>
          <input type="number" min="1" value={capacidadeMesa} onChange={(e) => setCapacidadeMesa(e.target.value)} />
          {erroMesa && <div className="erro-msg">{erroMesa}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Criar mesa</button>
        </form>
      </Modal>

      {/* Modal comanda */}
      <Modal titulo={mesaSelecionada ? `Mesa ${mesaSelecionada.numero}` : ''} aberto={!!mesaSelecionada} onFechar={fecharComanda} largura={460}>
        {comanda && (
          <div>
            {comanda.pedidos.map((p) => (
              <div key={p.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--borda)' }}>
                <div style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 4 }}>Pedido #{p.numero}</div>
                {p.itens.map((i) => (
                  <div key={i.id} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{i.quantidade}x {i.nomeProduto}</span>
                    <span>{fmtPreco(i.precoUnitario * i.quantidade)}</span>
                  </div>
                ))}
              </div>
            ))}

            {!comanda.pedidos.length && <p style={{ fontSize: 12.5, color: 'var(--texto2)' }}>Nenhum pedido em aberto nesta mesa.</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, margin: '14px 0' }}>
              <span>Total da comanda</span>
              <span style={{ color: 'var(--dourado)' }}>{fmtPreco(comanda.total)}</span>
            </div>

            {!modoTransferir ? (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => navigate('/pedidos/novo', { state: { mesaId: mesaSelecionada.id } })}>+ Adicionar pedido</button>
                  <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => setModoTransferir(true)}>Transferir mesa</button>
                  <button className="btn-outline" style={{ fontSize: 12, color: 'var(--erro)' }} onClick={handleFecharMesa}>Fechar mesa</button>
                </div>

                <div style={{ borderTop: '1px solid var(--borda)', paddingTop: 12 }}>
                  <label>Dividir conta entre quantas pessoas?</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" min="1" value={pessoasDividir} onChange={(e) => setPessoasDividir(e.target.value)} style={{ maxWidth: 90 }} />
                    <span style={{ fontSize: 14 }}>= <strong style={{ color: 'var(--dourado)' }}>{fmtPreco(valorPorPessoa)}</strong> por pessoa</span>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label>Transferir para a mesa:</label>
                <select value={mesaDestino} onChange={(e) => setMesaDestino(e.target.value)}>
                  <option value="">Selecione</option>
                  {mesasLivres.map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
                </select>
                {erroComanda && <div className="erro-msg">{erroComanda}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn-outline" style={{ flex: 1, borderRadius: 10 }} onClick={() => setModoTransferir(false)}>Voltar</button>
                  <button className="btn" style={{ flex: 1 }} onClick={handleTransferir}>Confirmar transferência</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal QR code da mesa */}
      <Modal titulo={modalQr ? `QR Code — Mesa ${modalQr.numero}` : ''} aberto={!!modalQr} onFechar={() => setModalQr(null)} largura={340}>
        {modalQr && usuario?.empresa?.slug && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', padding: 12, borderRadius: 10, display: 'inline-block' }}>
              <QRCodeCanvas value={`${window.location.origin}/cardapio/${usuario.empresa.slug}?mesa=${modalQr.numero}`} size={180} fgColor="#0a0a0a" bgColor="#ffffff" />
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--texto2)', marginTop: 12 }}>Cliente escaneia e vê o cardápio já identificando a Mesa {modalQr.numero}.</p>
          </div>
        )}
      </Modal>

      {/* Modal nova reserva */}
      <Modal titulo="Nova reserva" aberto={modalReserva} onFechar={() => setModalReserva(false)} largura={400}>
        <form onSubmit={handleCriarReserva}>
          <label>Nome do cliente</label>
          <input value={resNome} onChange={(e) => setResNome(e.target.value)} autoFocus />
          <label style={{ marginTop: 12 }}>Telefone</label>
          <input value={resTelefone} onChange={(e) => setResTelefone(e.target.value)} placeholder="Opcional" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label>Data e hora</label>
              <input type="datetime-local" value={resDataHora} onChange={(e) => setResDataHora(e.target.value)} />
            </div>
            <div>
              <label>Pessoas</label>
              <input type="number" min="1" value={resPessoas} onChange={(e) => setResPessoas(e.target.value)} />
            </div>
          </div>
          <label style={{ marginTop: 12 }}>Mesa (opcional)</label>
          <select value={resMesaId} onChange={(e) => setResMesaId(e.target.value)}>
            <option value="">Sem mesa definida</option>
            {mesas.map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
          </select>
          {erroReserva && <div className="erro-msg">{erroReserva}</div>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 16 }}>Confirmar reserva</button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
