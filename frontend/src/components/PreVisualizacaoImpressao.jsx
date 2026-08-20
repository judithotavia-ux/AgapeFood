// Mostra o mesmo conteudo (cabecalho/linhas) que o Agente de Impressao local receberia, como se
// fosse o papel saindo da impressora termica - pra dar pra conferir sem precisar do agente ligado.
function Linha({ tipo, texto }) {
  if (tipo === 'separador') {
    return <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />;
  }
  const estilos = {
    titulo: { fontWeight: 700, fontSize: 13.5, textAlign: 'center', margin: '2px 0' },
    texto: { fontSize: 12, margin: '2px 0' },
    item: { fontSize: 12, margin: '2px 0' },
    detalhe: { fontSize: 11, color: '#444', margin: '1px 0' }
  };
  return <div style={estilos[tipo] || estilos.texto}>{texto}</div>;
}

export default function PreVisualizacaoImpressao({ documento, larguraPapelMm = 80 }) {
  if (!documento) return null;
  const larguraPx = Math.round(larguraPapelMm * 3.4);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <div
        style={{
          width: larguraPx,
          maxWidth: '100%',
          background: '#fff',
          color: '#000',
          fontFamily: "'Courier New', Courier, monospace",
          padding: '16px 12px',
          boxShadow: '0 4px 18px rgba(0,0,0,.35)'
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'center' }}>{documento.cabecalho}</div>
        {documento.subcabecalho && <div style={{ fontSize: 11, textAlign: 'center', marginTop: 2 }}>{documento.subcabecalho}</div>}
        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
        {documento.linhas.map((l, i) => <Linha key={i} {...l} />)}
      </div>
    </div>
  );
}
