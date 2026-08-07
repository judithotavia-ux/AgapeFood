import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as cardapioService from '../services/cardapioService';

function fmtPreco(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

export default function CardapioPublico() {
  const { slug } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    cardapioService.buscarCardapioPublico(slug)
      .then(setDados)
      .catch(() => setErro('Não encontramos esse cardápio. Confira o link e tente novamente.'))
      .finally(() => setCarregando(false));
  }, [slug]);

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Carregando cardápio…
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f2ead9', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
        {erro}
      </div>
    );
  }

  const cor = dados.empresa.corPrimaria || '#D4AF37';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f2ead9', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 18px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {dados.empresa.logoUrl && (
            <img src={dados.empresa.logoUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }} />
          )}
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: cor, margin: 0 }}>{dados.empresa.nome}</h1>
          <div style={{ fontSize: 12, color: '#b8ac8e', marginTop: 4 }}>Cardápio digital</div>
        </div>

        {!dados.categorias.length && (
          <p style={{ textAlign: 'center', color: '#b8ac8e' }}>Nenhum produto disponível no momento.</p>
        )}

        {dados.categorias.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 16, color: cor, borderBottom: `1px solid ${cor}44`, paddingBottom: 8, marginBottom: 12 }}>{cat.nome}</h2>
            {cat.produtos.map((p) => (
              <div key={p.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ width: 66, height: 66, borderRadius: 10, background: '#151515', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.imagemUrl ? <img src={p.imagemUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🍽️</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.destaque && '⭐ '}{p.nome}</div>
                  {p.descricao && <div style={{ fontSize: 12, color: '#b8ac8e', marginTop: 3, lineHeight: 1.5 }}>{p.descricao}</div>}
                  {p.alergenos && <div style={{ fontSize: 10.5, color: '#e0a020', marginTop: 4 }}>⚠ Contém: {p.alergenos}</div>}
                  {!!p.adicionais?.length && (
                    <div style={{ fontSize: 10.5, color: '#b8ac8e', marginTop: 4 }}>
                      + Adicionais: {p.adicionais.map((a) => `${a.nome} (${fmtPreco(a.preco)})`).join(', ')}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>
                    {p.precoPromocional
                      ? <>
                          <span style={{ textDecoration: 'line-through', color: '#8a8272', marginRight: 8, fontWeight: 400, fontSize: 12 }}>{fmtPreco(p.preco)}</span>
                          <span style={{ color: cor }}>{fmtPreco(p.precoPromocional)}</span>
                        </>
                      : <span style={{ color: cor }}>{fmtPreco(p.preco)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div style={{ textAlign: 'center', fontSize: 11, color: '#5f5946', marginTop: 30 }}>
          Cardápio powered by AgapeFood
        </div>
      </div>
    </div>
  );
}
