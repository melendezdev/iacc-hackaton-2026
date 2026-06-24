import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
import React from 'react';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Callback ejecutado automáticamente por Better Auth al solicitar recuperar contraseña
    sendResetPassword: async (data, request) => {
      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        console.log("==================================================");
        console.log(`[RESEND MOCK] Correo de Recuperación de Contraseña`);
        console.log(`Destinatario: ${data.user.email}`);
        console.log(`Nombre: ${data.user.name}`);
        console.log(`Enlace de Restablecimiento: ${data.url}`);
        console.log("==================================================");
        return;
      }

      try {
        const { Resend } = await import('resend');
        const { ResetPasswordEmail } = await import('@/emails/ResetPasswordEmail');
        
        const resendClient = new Resend(apiKey);
        await resendClient.emails.send({
          from: 'Talita Kum Soporte <soporte@resend.dev>',
          to: data.user.email,
          subject: 'Talita Kum - Recuperación de Contraseña',
          react: React.createElement(ResetPasswordEmail, {
            userName: data.user.name,
            resetLink: data.url,
          }),
        });
        console.log(`Email de recuperación enviado por Resend a ${data.user.email}`);
      } catch (error) {
        console.error('Error enviando email de recuperación:', error);
      }
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || 'a-very-secure-hackaton-secret-key-1234567890',
  // Configuración de perfiles y roles personalizados
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'terapeuta',
      },
    },
  },
});
