// Gera Secundaria/Destaque/Texto a partir da Cor Primaria - deixa a identidade visual coerente
// mesmo se o usuario so escolher uma cor, sem precisar entender de paleta de cores.
function hexParaRgb(hex) {
  const limpo = hex.replace('#', '');
  const valor = limpo.length === 3 ? limpo.split('').map((c) => c + c).join('') : limpo;
  const num = parseInt(valor, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbParaHex({ r, g, b }) {
  const c = (x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbParaHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslParaRgb({ h, s, l }) {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = l * 255; return { r: v, g: v, b: v }; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: hue2rgb(h + 1 / 3) * 255, g: hue2rgb(h) * 255, b: hue2rgb(h - 1 / 3) * 255 };
}

const HEX_VALIDO = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function gerarPaletaAutomatica(corPrimariaHex) {
  if (!corPrimariaHex || !HEX_VALIDO.test(corPrimariaHex)) return null;

  const rgb = hexParaRgb(corPrimariaHex);
  const hsl = rgbParaHsl(rgb);

  const corSecundaria = rgbParaHex(hslParaRgb({ h: hsl.h, s: Math.max(hsl.s - 15, 10), l: Math.max(hsl.l - 32, 8) }));
  const corDestaque = rgbParaHex(hslParaRgb({ h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 22, 82) }));

  // Contraste de texto pela luminancia percebida (formula padrao), nao so pela luminosidade HSL -
  // fica mais fiel a como o olho humano le a cor como "clara" ou "escura".
  const luminancia = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  const corTexto = luminancia < 150 ? '#ffffff' : '#000000';

  return { corSecundaria, corDestaque, corTexto };
}
