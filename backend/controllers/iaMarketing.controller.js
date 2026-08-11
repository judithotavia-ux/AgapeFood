const prisma = require('../prisma/client');
const Anthropic = require('@anthropic-ai/sdk');
const { obterClienteAnthropic } = require('../services/anthropicCliente.service');

const CANAIS_VALIDOS = ['WHATSAPP', 'EMAIL', 'SMS', 'INSTAGRAM', 'FACEBOOK', 'PUSH', 'OUTRO'];

const FORMATO_POR_CANAL = {
  WHATSAPP: 'até 300 caracteres, tom direto e pessoal, pode usar 1-2 emojis',
  SMS: 'até 160 caracteres, sem emojis, direto ao ponto',
  EMAIL: 'assunto (até 60 caracteres) + corpo do email (até 150 palavras)',
  INSTAGRAM: 'legenda de post, até 150 palavras, pode usar emojis e até 5 hashtags relevantes',
  FACEBOOK: 'texto de post, até 120 palavras, tom próximo',
  PUSH: 'notificação push: título (até 40 caracteres) + texto (até 100 caracteres)',
  OUTRO: 'até 150 palavras, tom geral de divulgação'
};

async function gerarTexto(req, res) {
  const { canal, objetivo, segmento, tom } = req.body || {};
  if (!CANAIS_VALIDOS.includes(canal)) return res.status(400).json({ erro: 'Canal inválido.' });
  if (!objetivo || !objetivo.trim()) return res.status(400).json({ erro: 'Descreva o objetivo da campanha.' });

  const client = await obterClienteAnthropic(req.usuario.empresaId);
  if (!client) {
    return res.status(503).json({ erro: 'A geração por IA ainda não foi configurada nesta instalação. Fale com o suporte AgapeFood.' });
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: req.usuario.empresaId }, select: { nome: true } });

  const prompt = `Escreva o texto de uma campanha de marketing para "${empresa?.nome || 'o restaurante'}", um estabelecimento de alimentação.

Canal: ${canal} (formato esperado: ${FORMATO_POR_CANAL[canal]})
Objetivo da campanha: ${objetivo.trim()}
Público-alvo: ${segmento?.trim() || 'clientes em geral'}
Tom desejado: ${tom?.trim() || 'amigável e convidativo'}

Retorne APENAS o texto pronto para envio, sem explicações, sem aspas ao redor, sem markdown.${canal === 'EMAIL' ? ' Para email, use o formato:\nAssunto: <assunto>\n\n<corpo>' : ''}`;

  try {
    const resposta = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      system: 'Você é um especialista em marketing para restaurantes e lanchonetes brasileiros. Escreva em português do Brasil, de forma natural e persuasiva, sem exagero.',
      messages: [{ role: 'user', content: prompt }]
    });

    const bloco = resposta.content.find((b) => b.type === 'text');
    res.json({ texto: bloco?.text?.trim() || '' });
  } catch (erro) {
    if (erro instanceof Anthropic.AuthenticationError) {
      return res.status(503).json({ erro: 'Chave da API de IA inválida. Verifique a configuração no servidor.' });
    }
    if (erro instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ erro: 'Limite de uso da IA atingido. Tente novamente em instantes.' });
    }
    console.error('Erro ao gerar texto com IA:', erro);
    res.status(500).json({ erro: 'Não foi possível gerar o texto agora. Tente novamente.' });
  }
}

module.exports = { gerarTexto };
