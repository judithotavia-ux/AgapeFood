const { Resend } = require('resend');

function clienteResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function configurado() {
  return !!process.env.RESEND_API_KEY;
}

async function enviarEmailResetSenha({ destinatario, nome, link }) {
  const client = clienteResend();
  if (!client) throw new Error('RESEND_API_KEY não configurada.');

  const remetente = process.env.RESEND_FROM_EMAIL || 'AgapeFood <onboarding@resend.dev>';

  await client.emails.send({
    from: remetente,
    to: destinatario,
    subject: 'Redefinir sua senha — AgapeFood',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #211D14;">
        <h2 style="color: #96691C;">Redefinir sua senha</h2>
        <p>Olá, ${nome || ''}.</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta no AgapeFood. Clique no botão abaixo para escolher uma nova senha:</p>
        <p style="margin: 28px 0;">
          <a href="${link}" style="background: #D4AF37; color: #16130a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Redefinir senha
          </a>
        </p>
        <p style="font-size: 13px; color: #6B6354;">Esse link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha continua a mesma.</p>
      </div>
    `
  });
}

module.exports = { enviarEmailResetSenha, configurado };
