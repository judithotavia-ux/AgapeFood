const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';

function chave() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY ausente ou inválida (precisa ter 64 caracteres hexadecimais / 32 bytes).');
  }
  return Buffer.from(hex, 'hex');
}

function criptografar(texto) {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv(ALGORITMO, chave(), iv);
  const criptografado = Buffer.concat([cifra.update(String(texto), 'utf8'), cifra.final()]);
  const tag = cifra.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), criptografado.toString('hex')].join(':');
}

function descriptografar(valor) {
  const [ivHex, tagHex, dadosHex] = String(valor).split(':');
  if (!ivHex || !tagHex || !dadosHex) throw new Error('Valor criptografado em formato inválido.');
  const decifra = crypto.createDecipheriv(ALGORITMO, chave(), Buffer.from(ivHex, 'hex'));
  decifra.setAuthTag(Buffer.from(tagHex, 'hex'));
  const original = Buffer.concat([decifra.update(Buffer.from(dadosHex, 'hex')), decifra.final()]);
  return original.toString('utf8');
}

module.exports = { criptografar, descriptografar };
