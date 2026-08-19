// Padrao alto de proposito - um pedido novo precisa chamar atencao de verdade, nao ser um "ding"
// discreto facil de nao notar em cima do barulho de um salao/cozinha.
let volume = Number(localStorage.getItem('agape_alerta_volume') ?? '0.9');
const timersRepeticao = {};

export function definirVolume(v) {
  volume = v;
  localStorage.setItem('agape_alerta_volume', String(v));
}

export function obterVolume() {
  return volume;
}

// Um contexto so, reaproveitado - criar um AudioContext novo pra cada tom (a sirene toca 6, a
// cada 15s enquanto ninguem reconhece) esgota o limite de contextos simultaneos que o navegador
// permite por pagina, e a falha fica engolida pelo catch, dando silencio total sem erro visivel.
let ctxAudio = null;
function obterContextoAudio() {
  if (!ctxAudio) ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
  if (ctxAudio.state === 'suspended') ctxAudio.resume().catch(() => {});
  return ctxAudio;
}

// Navegadores só liberam audio depois de alguma interacao do usuario na pagina - destrava o
// contexto assim que isso acontecer, em vez de depender do proprio alarme ser o "primeiro som".
if (typeof window !== 'undefined') {
  const destravarAudio = () => { try { obterContextoAudio(); } catch (e) { /* ignora */ } };
  ['click', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, destravarAudio, { once: true }));
}

function tocarTom(freq, duracaoMs, atrasoS = 0, tipoOnda = 'sine') {
  if (volume <= 0) return;
  try {
    const ctx = obterContextoAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = tipoOnda;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(Math.min(volume, 1), ctx.currentTime + atrasoS);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + atrasoS + duracaoMs / 1000);
    osc.start(ctx.currentTime + atrasoS);
    osc.stop(ctx.currentTime + atrasoS + duracaoMs / 1000 + 0.02);
  } catch (e) { /* navegador sem suporte a audio, ignora */ }
}

// Sirene curta (alterna 2 tons com onda "quadrada", mais aspera que um sine) em vez de um jingle
// suave - o objetivo aqui e interromper o que a pessoa esta fazendo, nao soar agradavel.
export function tocarAlertaNovoPedido() {
  const padraoHz = [1100, 700, 1100, 700, 1100, 700];
  padraoHz.forEach((f, i) => tocarTom(f, 140, i * 0.15, 'square'));
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
