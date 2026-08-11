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

async function enviarEmailOtpCliente({ destinatario, nome, codigo, empresaNome }) {
  const client = clienteResend();
  if (!client) throw new Error('RESEND_API_KEY não configurada.');

  const remetente = process.env.RESEND_FROM_EMAIL || 'AgapeFood <onboarding@resend.dev>';

  await client.emails.send({
    from: remetente,
    to: destinatario,
    subject: `${codigo} — seu código de acesso (${empresaNome || 'AgapeFood'})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #211D14;">
        <h2 style="color: #96691C;">Seu código de acesso</h2>
        <p>Olá${nome ? ', ' + nome : ''}.</p>
        <p>Use o código abaixo para entrar na sua conta em <strong>${empresaNome || 'AgapeFood'}</strong>:</p>
        <p style="margin: 28px 0; text-align: center;">
          <span style="background: #D4AF37; color: #16130a; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 28px; letter-spacing: 6px; display: inline-block;">
            ${codigo}
          </span>
        </p>
        <p style="font-size: 13px; color: #6B6354;">Esse código expira em 10 minutos. Se você não pediu esse acesso, pode ignorar este e-mail.</p>
      </div>
    `
  });
}

module.exports = { enviarEmailResetSenha, enviarEmailOtpCliente, configurado };
