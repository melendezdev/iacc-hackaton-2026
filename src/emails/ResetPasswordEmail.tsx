import * as React from 'react';
import {
  Html,
  Body,
  Head,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
  Tailwind,
  Preview,
} from '@react-email/components';

interface ResetPasswordEmailProps {
  userName: string;
  resetLink: string;
}

export function ResetPasswordEmail({
  userName = 'Terapeuta',
  resetLink = 'http://localhost:3000/reset-password?token=mock_token',
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Talita Kum - Recuperación de Contraseña</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans py-8">
          <Container className="bg-white border border-slate-200 rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
            
            {/* Header Corporativo */}
            <Section className="mb-6">
              <Text className="text-emerald-600 font-extrabold text-sm uppercase tracking-widest m-0">
                Talita Kum
              </Text>
              <Text className="text-xs text-slate-500 m-0">
                Centro de Rehabilitación e Intervención Terapéutica
              </Text>
            </Section>

            {/* Encabezado */}
            <Section className="mb-6">
              <Heading className="text-xl font-extrabold text-slate-800 m-0 leading-tight">
                Restablecer tu Contraseña
              </Heading>
              <Text className="text-xs text-slate-600 mt-2 mb-0 leading-relaxed">
                Hola <strong>{userName}</strong>, recibimos una solicitud para restablecer la contraseña de acceso a tu cuenta en la plataforma clínica de Talita Kum.
              </Text>
            </Section>

            {/* Botón de Acción */}
            <Section className="text-center my-8">
              <Link
                href={resetLink}
                className="inline-block bg-primary bg-slate-900 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl shadow-md hover:bg-slate-800 transition-all text-center decoration-none"
              >
                Restablecer Contraseña
              </Link>
            </Section>

            <Text className="text-xs text-slate-500 leading-relaxed mb-6">
              Este enlace de recuperación es válido por 1 hora. Si el botón anterior no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:
              <br />
              <Link href={resetLink} className="text-emerald-600 break-all underline block mt-2">
                {resetLink}
              </Link>
            </Text>

            <Hr className="border-slate-200 my-6" />

            {/* Aviso de Seguridad */}
            <Section className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mb-6 text-xs text-slate-600">
              <Text className="m-0 leading-relaxed font-semibold">
                🔒 Seguridad de la cuenta:
              </Text>
              <Text className="m-0 mt-1 leading-relaxed text-slate-500">
                Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo válida y no se realizarán modificaciones en tu perfil.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="text-center mt-6">
              <Text className="text-[10px] text-slate-400 m-0">
                Talita Kum - Sistema Clínico Integrado
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
export default ResetPasswordEmail;
