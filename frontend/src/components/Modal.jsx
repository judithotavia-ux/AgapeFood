export default function Modal({ titulo, aberto, onFechar, children, largura = 480 }) {
  if (!aberto) return null;

  return (
    <div
      onClick={onFechar}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: '100%', maxWidth: largura, maxHeight: '88vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 17 }}>{titulo}</h3>
          <button
            onClick={onFechar}
            style={{ background: 'none', border: 'none', color: 'var(--texto2)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
