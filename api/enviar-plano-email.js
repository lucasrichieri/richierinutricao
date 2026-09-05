import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Configurações de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const {
      destinatarioEmail,
      pacienteNome = 'Paciente',
      planoTitulo = 'Plano Alimentar Semanal',
      mensagemPersonalizada = '',
      pdfBase64,
      nutricionistaNome = 'Richieri Nutrição',
    } = req.body || {};

    if (!destinatarioEmail || !destinatarioEmail.includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail válido para envio.' });
    }

    if (!pdfBase64) {
      return res.status(400).json({ error: 'Arquivo PDF não fornecido.' });
    }

    // Configuração de Credenciais SMTP com .trim()
    const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const smtpPort = parseInt((process.env.SMTP_PORT || '465').toString().trim(), 10);
    const smtpSecure = smtpPort === 465;
    const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim();
    const emailFrom = (process.env.SMTP_FROM || process.env.EMAIL_FROM || smtpUser || 'contato@richierinutricao.com.br').trim();

    // Se as credenciais SMTP não estiverem preenchidas no .env
    if (!smtpUser || !smtpPass) {
      console.warn('Credenciais SMTP (SMTP_USER e SMTP_PASS) não configuradas no .env.');
      return res.status(200).json({
        success: false,
        requiresConfig: true,
        mensagem:
          'Para enviar o e-mail diretamente pelo sistema, configure SMTP_USER e SMTP_PASS no arquivo .env.',
      });
    }

    // Converte base64 para Buffer do anexo
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    const sanitizedFilename = `Plano_Alimentar_${pacienteNome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    // Cria transportador Nodemailer
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px; color: #1E293B;">
        <div style="text-align: center; border-bottom: 2px solid #15803D; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #15803D; margin: 0;">Richieri Nutrição</h2>
          <p style="color: #64748B; margin: 5px 0 0; font-size: 13px;">Nutrição Clínica & Esportiva de Alta Performance</p>
        </div>

        <p style="font-size: 15px; line-height: 1.5;">
          Olá, <strong>${pacienteNome}</strong>!
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${mensagemPersonalizada ? mensagemPersonalizada.replace(/\n/g, '<br>') : 'Segue em anexo o seu <strong>Plano Alimentar Semanal</strong> individualizado e detalhado, elaborado especialmente para os seus objetivos.'}
        </p>

        <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
          <strong style="color: #166534; display: block; font-size: 14px;">📄 Arquivo Anexo:</strong>
          <span style="color: #15803D; font-size: 13px;">${sanitizedFilename} (Documento em PDF de 4 páginas com os 7 dias completos)</span>
        </div>

        <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
          Dúvidas ou ajustes, fique à vontade para entrar em contato com nossa equipe.
        </p>

        <div style="border-top: 1px solid #E2E8F0; margin-top: 25px; padding-top: 15px; font-size: 12px; color: #94A3B8; text-align: center;">
          <strong>${nutricionistaNome}</strong><br>
          Richieri Nutrição • Sistema de Prescrição Nutricional
        </div>
      </div>
    `;

    // Envia o e-mail
    const info = await transporter.sendMail({
      from: `"Richieri Nutrição" <${emailFrom}>`,
      to: destinatarioEmail,
      subject: `🥗 Seu Plano Alimentar Semanal — ${pacienteNome}`,
      text: `Olá ${pacienteNome}, segue em anexo o seu Plano Alimentar Semanal elaborado pela Richieri Nutrição.`,
      html: emailHtml,
      attachments: [
        {
          filename: sanitizedFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('E-mail com plano alimentar enviado com sucesso:', info.messageId);

    return res.status(200).json({
      success: true,
      mensagem: `Plano alimentar enviado com sucesso para ${destinatarioEmail}!`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail com plano alimentar:', error);

    const errorMessage = error.message || '';
    const errorResponse = error.response || '';

    if (errorMessage.includes('Application-specific password required') || errorResponse.includes('534')) {
      return res.status(400).json({
        success: false,
        error: 'O Gmail requer uma "Senha de Aplicativo" de 16 caracteres (não a sua senha pessoal normal).',
        detalhes: 'Acesse sua Conta Google > Segurança > Verificação em duas etapas > Senhas de app, gere uma senha e cole no SMTP_PASS do arquivo .env.',
      });
    }

    if (errorMessage.includes('Username and Password not accepted') || errorResponse.includes('535')) {
      return res.status(400).json({
        success: false,
        error: 'Credenciais de e-mail inválidas ou não aceitas pelo servidor SMTP.',
        detalhes: 'Verifique se o e-mail e a Senha de Aplicativo no arquivo .env estão corretos.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Falha ao enviar e-mail.',
      detalhes: error.message,
    });
  }
}
