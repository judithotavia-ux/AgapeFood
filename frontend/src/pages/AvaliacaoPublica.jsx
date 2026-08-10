import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as marketingService from '../services/marketingService';

function fmtPreco(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

export default function AvaliacaoPublica() {
  const { pedidoId } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    marketingService.obterAvaliacaoPublica(pedidoId)
      .then(setDados)
      .catch(() => setErro('Não encontramos esse pedido. Confira o link e tente novamente.'))
      .finally(() => setCarregando(false));
  }, [pedidoId]);

  async function handleEnviar() {
    setErroEnvio('');
    if (!nota) return setErroEnvio('Escolha uma nota de 1 a 5 estrelas.');
    setEnviando(true);
    try {
      await marketingService.criarAvaliacaoPublica(pedidoId, { nota, comentario: comentario || undefined });
      setEnviado(true);
    } catch (err) {
      setErroEnvio(err.response?.data?.erro || 'Não foi possível enviar sua avaliação.');
    } finally {
      setEnviando(false);
    }
  }

  const estilo = { minHeight: '100vh', background: '#0a0a0a', color: '#f2ead9', fontFamily: "'Segoe UI', Arial, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const cor = '#D4AF37';

  if (carregando) return <div style={estilo}>Carregando…</div>;
  if (erro) return <div style={{ ...estilo, textAlign: 'center' }}>{erro}</div>;

  if (dados.jaAvaliado || enviado) {
    return (
      <div style={estilo}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>💛</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: cor, margin: '0 0 8px' }}>Obrigado pela sua avaliação!</h1>
          <p style={{ color: '#b8ac8e', fontSize: 13.5 }}>Seu feedback nos ajuda a melhorar cada vez mais.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={estilo}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: cor, margin: '0 0 6px' }}>Como foi seu pedido?</h1>
          <p style={{ color: '#b8ac8e', fontSize: 13 }}>Pedido #{dados.pedido.numero} · {fmtPreco(dados.pedido.valorTotal)}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 22 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setNota(n)}
              onMouseEnter={() => setNotaHover(n)}
              onMouseLeave={() => setNotaHover(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 34, padding: 0, filter: n <= (notaHover || nota) ? 'none' : 'grayscale(1) opacity(0.4)' }}
            >
              ⭐
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Conte mais sobre sua experiência (opcional)"
          style={{ width: '100%', boxSizing: 'border-box', background: '#151515', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#f2ead9', padding: 12, fontSize: 13.5, resize: 'vertical' }}
        />

        {erroEnvio && <div style={{ color: '#e06666', fontSize: 12.5, marginTop: 10 }}>{erroEnvio}</div>}

        <button
          onClick={handleEnviar}
          disabled={enviando}
          style={{ width: '100%', marginTop: 16, padding: '13px 0', borderRadius: 10, border: 'none', background: cor, color: '#0a0a0a', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}
        >
          {enviando ? 'Enviando…' : 'Enviar avaliação'}
        </button>
      </div>
    </div>
  );
}
