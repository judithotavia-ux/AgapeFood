// Aplica a cor primaria da empresa nas variaveis CSS globais (--dourado e derivadas), recolorindo
// o painel administrativo inteiro sem precisar tocar em cada componente. So a cor primaria e
// aplicada aqui - texto/erro/sucesso ficam fixos pra nao arriscar contraste ilegivel com uma
// escolha de cor da empresa.

function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function hexParaRgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function ajustarBrilho({ r, g, b }, quantidade) {
  return `rgb(${clamp(r + quantidade)}, ${clamp(g + quantidade)}, ${clamp(b + quantidade)})`;
}

export function aplicarTemaEmpresa(corPrimaria) {
  const rgb = hexParaRgb(corPrimaria);
  if (!rgb) return;

  const raiz = document.documentElement.style;
  raiz.setProperty('--dourado', corPrimaria);
  raiz.setProperty('--dourado-claro', ajustarBrilho(rgb, 45));
  raiz.setProperty('--dourado-escuro', ajustarBrilho(rgb, -35));
  raiz.setProperty('--borda', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
}
