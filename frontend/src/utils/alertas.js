let volume = Number(localStorage.getItem('agape_alerta_volume') ?? '0.6');
const timersRepeticao = {};

export function definirVolume(v) {
  volume = v;
  localStorage.setItem('agape_alerta_volume', String(v));
}

export function obterVolume() {
  return volume;
}

function tocarTom(freq, duracaoMs, atrasoS = 0) {
  if (volume <= 0) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime + atrasoS);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + atrasoS + duracaoMs / 1000);
    osc.start(ctx.currentTime + atrasoS);
    osc.stop(ctx.currentTime + atrasoS + duracaoMs / 1000 + 0.02);
  } catch (e) { /* navegador sem suporte a audio, ignora */ }
}

export function tocarAlertaNovoPedido() {
  [880, 1046, 1318].forEach((f, i) => tocarTom(f, 160, i * 0.17));
}

export function tocarAlertaCancelamento() {
  [660, 440].forEach((f, i) => tocarTom(f, 220, i * 0.22));
}

export function iniciarRepeticao(chave, tocarFn, intervaloMs = 15000) {
  pararRepeticao(chave);
  tocarFn();
  timersRepeticao[chave] = setInterval(tocarFn, intervaloMs);
}

export function pararRepeticao(chave) {
  if (timersRepeticao[chave]) {
    clearInterval(timersRepeticao[chave]);
    delete timersRepeticao[chave];
  }
}

export function pararTodasRepeticoes() {
  Object.keys(timersRepeticao).forEach(pararRepeticao);
}

export async function pedirPermissaoNotificacao() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission;
  return Notification.requestPermission();
}

export function obterPermissaoNotificacao() {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

export function notificarNovoPedido(pedido, tipoLabel) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(`Novo pedido #${pedido.numero}`, {
      body: `${tipoLabel || pedido.tipo}${pedido.clienteNome ? ' · ' + pedido.clienteNome : ''}`,
      tag: `pedido-${pedido.id}`
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch (e) { /* ambiente sem suporte total a Notification, ignora */ }
}
