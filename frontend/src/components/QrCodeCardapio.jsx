import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QrCodeCardapio({ slug }) {
  const canvasWrapRef = useRef(null);
  const url = `${window.location.origin}/cardapio/${slug}`;

  function copiarLink() {
    navigator.clipboard.writeText(url);
  }

  function baixarQrCode() {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `cardapio-qrcode-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <div ref={canvasWrapRef} style={{ background: '#fff', padding: 10, borderRadius: 10, flexShrink: 0 }}>
        <QRCodeCanvas value={url} size={110} fgColor="#0a0a0a" bgColor="#ffffff" />
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <h4 style={{ fontSize: 15, marginBottom: 4 }}>Cardápio digital com QR Code</h4>
        <p style={{ fontSize: 12, color: 'var(--texto2)', marginBottom: 10 }}>
          Imprima esse QR Code nas mesas ou embalagens. Ao escanear, o cliente vê seu cardápio direto no celular.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, wordBreak: 'break-all' }}>{url}</a>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" className="btn-outline" style={{ borderRadius: 8, fontSize: 12, padding: '7px 12px' }} onClick={copiarLink}>Copiar link</button>
          <button type="button" className="btn-outline" style={{ borderRadius: 8, fontSize: 12, padding: '7px 12px' }} onClick={baixarQrCode}>Baixar QR Code</button>
        </div>
      </div>
    </div>
  );
}
