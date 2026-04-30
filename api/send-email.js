import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nombre, empresa, email, presupuesto, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, email, mensaje' });
  }

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f1ea; border: 2px solid #0a0a0a;">
      <div style="background: #0a0a0a; color: #caff00; padding: 20px 24px; font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
        ● Nuevo contacto desde knowin.es
      </div>
      <div style="padding: 32px 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #ddd; font-weight: 700; width: 120px; vertical-align: top;">Nombre</td><td style="padding: 12px 0; border-bottom: 1px solid #ddd;">${nombre}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #ddd; font-weight: 700; vertical-align: top;">Email</td><td style="padding: 12px 0; border-bottom: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
          ${empresa ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid #ddd; font-weight: 700; vertical-align: top;">Empresa</td><td style="padding: 12px 0; border-bottom: 1px solid #ddd;">${empresa}</td></tr>` : ''}
          ${presupuesto ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid #ddd; font-weight: 700; vertical-align: top;">Presupuesto</td><td style="padding: 12px 0; border-bottom: 1px solid #ddd;">${presupuesto}</td></tr>` : ''}
          <tr><td style="padding: 12px 0; font-weight: 700; vertical-align: top;">Mensaje</td><td style="padding: 12px 0;">${mensaje.replace(/\n/g, '<br>')}</td></tr>
        </table>
      </div>
      <div style="background: #0a0a0a; color: #666; padding: 16px 24px; font-size: 11px;">
        Enviado desde el formulario de knowin.es
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Knowin Web" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `Nueva solicitud — ${nombre}${empresa ? ` (${empresa})` : ''}`,
      html: htmlContent,
    });

    return res.status(200).json({ ok: true, message: 'Email enviado correctamente' });
  } catch (error) {
    console.error('Error enviando email:', error);
    return res.status(500).json({ error: 'Error al enviar el email' });
  }
}
