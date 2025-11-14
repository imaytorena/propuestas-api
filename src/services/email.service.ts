import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendWelcomeEmail(email: string, nombre?: string): Promise<void> {
    const nombreCompleto = nombre || 'Usuario';
    
    // Simular el contenido del email que se enviaría
    const emailContent = this.getWelcomeEmailTemplate(nombreCompleto);

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
        from: `"${process.env.MAIL_FROM_NAME || 'ColectividApp'}" <${process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@colectividapp.com'}>`,
        to: email,
        subject: '¡Bienvenido/a a ColectividApp!',
        html: emailContent,
      });
      
    } catch (error) {
      this.logger.error(`❌ Error enviando email a ${email}:`, error);
    }
  }

  async sendEventConfirmationEmail(
    email: string,
    nombre: string,
    propuesta: any,
    actividades: any[],
  ): Promise<void> {
    const emailContent = this.getEventConfirmationTemplate(nombre, propuesta, actividades);
    this.logger.debug(`Contenido del email:\n${emailContent}`);
    
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
        from: `"${process.env.MAIL_FROM_NAME || 'ColectividApp'}" <${process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@colectividapp.com'}>`,
        to: email,
        subject: `Confirmación de asistencia: ${propuesta.titulo}`,
        html: emailContent,
      });
      
    } catch (error) {
      this.logger.error(`❌ Error enviando email de confirmación a ${email}:`, error);
    }
  }

  private getWelcomeEmailTemplate(nombre: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">¡Bienvenido/a a ColectividApp!</h1>
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
          <p>Saludos,<br>El equipo de </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    `;
  }

  private getEventConfirmationTemplate(nombre: string, propuesta: any, actividades: any[]): string {
    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const actividadesHtml = actividades.map(actividad => `
      <div style="border-left: 4px solid #007bff; padding-left: 15px; margin: 10px 0;">
        <h4 style="margin: 0; color: #007bff;">${actividad.nombre}</h4>
        <p style="margin: 5px 0; color: #666;">${actividad.descripcion}</p>
        <p style="margin: 5px 0; font-weight: bold;">
          📅 ${formatDate(actividad.fecha)}
          ${actividad.horario ? `⏰ ${actividad.horario}` : ''}
        </p>
      </div>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: black;">
          <h1 style="margin: 0;">¡Confirmación de Asistencia!</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>¡Excelente! Has confirmado tu asistencia al siguiente evento:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">${propuesta.titulo}</h2>
            <p style="color: #666; line-height: 1.6;">${propuesta.descripcion}</p>
            <p><strong>Comunidad:</strong> ${propuesta.comunidad?.nombre || 'N/A'}</p>
          </div>

          ${actividades.length > 0 ? `
            <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">📋 Actividades del Evento</h3>
            ${actividadesHtml}
          ` : ''}

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2d5a2d;"><strong>💡 Recordatorio:</strong> Te recomendamos guardar este email para tener toda la información del evento a mano.</p>
          </div>

          <p>¡Esperamos verte pronto!</p>
          <p>Saludos,<br>El equipo de ColectividApp</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    `;
  }
}