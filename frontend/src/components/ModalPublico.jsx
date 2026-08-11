export default function ModalPublico({ titulo, aberto, onFechar, children, cor = '#D4AF37', largura = 440 }) {
  if (!aberto) return null;

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: largura, maxHeight: '86vh', overflowY: 'auto',
          background: '#151515', border: `1px solid ${cor}33`, borderBottom: 'none',
          borderRadius: '18px 18px 0 0', padding: 22,
          color: '#f2ead9', fontFamily: "'Segoe UI', Arial, sans-serif"
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, margin: 0, fontFamily: 'Georgia, serif', color: cor, fontWeight: 400 }}>{titulo}</h3>
          <button
            onClick={onFechar}
            style={{ background: 'none', border: 'none', color: '#b8ac8e', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
