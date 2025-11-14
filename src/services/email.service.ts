import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendWelcomeEmail(email: string, nombre?: string): Promise<void> {
    const nombreCompleto = nombre || 'Usuario';
    
    // En desarrollo, logueamos el email
    this.logger.log(`📧 Enviando email de bienvenida a: ${email}`);
    this.logger.log(`👋 Bienvenido/a ${nombreCompleto} a COLECTIVIDAPI!`);
    
    // Simular el contenido del email que se enviaría
    const emailContent = this.getWelcomeEmailTemplate(nombreCompleto);
    this.logger.debug(`Contenido del email:\n${emailContent}`);
    
    // Envío real de email con SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'localhost',
        port: parseInt(process.env.MAIL_PORT || '1025'),
        secure: process.env.MAIL_PORT === '465',
        requireTLS: process.env.MAIL_PORT === '587',
        auth: process.env.MAIL_USER ? {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        } : undefined,
      });
      
      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@colectividapp.com',
        to: email,
        subject: '¡Bienvenido/a a COLECTIVIDAP!',
        html: emailContent,
      });
      
      this.logger.log(`✅ Email enviado exitosamente a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando email a ${email}:`, error);
    }
  }

  private getWelcomeEmailTemplate(nombre: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">¡Bienvenido/a a COLECTIVIDAP!</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>¡Gracias por unirte a nuestra comunidad! Tu cuenta ha sido creada exitosamente.</p>
          <p>Ahora puedes:</p>
          <ul>
            <li>Crear y unirte a comunidades</li>
            <li>Proponer ideas y actividades</li>
            <li>Participar en propuestas de otros usuarios</li>
            <li>Conectar con personas de tu área</li>
          </ul>
          <p>¡Esperamos que disfrutes de la experiencia!</p>
          <p>Saludos,<br>El equipo de COLECTIVIDAPI</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    `;
  }
}