import { Link } from 'react-router-dom';

export default function BloqueioPlano({ planoAtual }) {
  return (
    <div className="card" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 36 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
      <h3 style={{ marginBottom: 8 }}>Recurso não disponível no seu plano</h3>
      <p style={{ color: 'var(--texto2)', fontSize: 13.5, marginBottom: 18 }}>
        {planoAtual ? `Seu plano atual é o ${planoAtual}. ` : ''}
        Esse módulo faz parte de um plano superior. Fale com o suporte pra fazer upgrade.
      </p>
      <Link to="/assinatura" className="btn" style={{ display: 'inline-block' }}>Ver planos</Link>
    </div>
  );
}
