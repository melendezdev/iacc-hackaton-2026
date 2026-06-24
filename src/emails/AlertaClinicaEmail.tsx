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

interface AlertaClinicaEmailProps {
  pacienteNombre: string;
  pacienteRut: string;
  terapeutaNombre: string;
  objetivo: string;
  desarrollo: string;
  acuerdos: string;
  accionesSeguir: string;
  observaciones: string;
  fechaIntervencion: string;
}

export function AlertaClinicaEmail({
  pacienteNombre = 'Juan Pérez',
  pacienteRut = '18.452.963-4',
  terapeutaNombre = 'Psi. Alejandro Meléndez',
  objetivo = 'Manejo de crisis por descompensación emocional.',
  desarrollo = 'El paciente ingresa al centro con llanto incontrolable, manifestando deseos de abandonar el proceso y reporta ideación autolítica leve sin plan estructurado.',
  acuerdos = 'Firma de compromiso de no autolesión y permanencia en la residencia.',
  accionesSeguir = 'Monitoreo constante cada 2 horas por personal técnico de turno y derivación a psiquiatría.',
  observaciones = 'Alerta crítica activada por descompensación afectiva severa e ideación de daño.',
  fechaIntervencion = new Date().toLocaleString(),
}: AlertaClinicaEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>ALERTA CLÍNICA: Intervención de urgencia detectada para {pacienteNombre}</Preview>
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

            {/* Banner Alerta */}
            <Section className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 mb-6">
              <Heading className="text-lg font-black text-rose-700 m-0 leading-tight">
                🚨 ALERTA CLÍNICA CRÍTICA DETECTADA
              </Heading>
              <Text className="text-xs text-rose-800/80 mt-1 mb-0 leading-relaxed font-semibold">
                Se ha registrado y validado un reporte de intervención que gatilla el protocolo de emergencia o alerta de recaída/urgencia emocional.
              </Text>
            </Section>

            {/* Ficha Paciente y Terapeuta */}
            <Section className="mb-6 bg-slate-100/50 rounded-2xl p-4 border border-slate-200/50">
              <Text className="text-xs text-slate-600 my-1">
                👤 <strong>Paciente:</strong> {pacienteNombre} ({pacienteRut})
              </Text>
              <Text className="text-xs text-slate-600 my-1">
                👨‍⚕️ <strong>Terapeuta Interventor:</strong> {terapeutaNombre}
              </Text>
              <Text className="text-xs text-slate-600 my-1">
                📅 <strong>Fecha Intervención:</strong> {fechaIntervencion}
              </Text>
            </Section>

            <Hr className="border-slate-200 my-6" />

            {/* Cuerpo del Reporte Clínico */}
            <Section className="space-y-4">
              <Heading className="text-xs font-black uppercase tracking-wider text-slate-400 m-0">
                Resumen Clínico Estructurado
              </Heading>
              
              <div className="mt-3">
                <Text className="text-xs font-extrabold text-slate-800 m-0 uppercase tracking-widest">
                  1. Objetivo de la Intervención
                </Text>
                <Text className="text-xs text-slate-700 mt-1 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  {objetivo}
                </Text>
              </div>

              <div>
                <Text className="text-xs font-extrabold text-slate-800 m-0 uppercase tracking-widest">
                  2. Desarrollo de lo ocurrido
                </Text>
                <Text className="text-xs text-slate-700 mt-1 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  {desarrollo}
                </Text>
              </div>

              <div>
                <Text className="text-xs font-extrabold text-slate-800 m-0 uppercase tracking-widest">
                  3. Acuerdos e Hitos
                </Text>
                <Text className="text-xs text-slate-700 mt-1 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  {acuerdos}
                </Text>
              </div>

              <div>
                <Text className="text-xs font-extrabold text-slate-800 m-0 uppercase tracking-widest">
                  4. Acciones a Seguir
                </Text>
                <Text className="text-xs text-slate-700 mt-1 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  {accionesSeguir}
                </Text>
              </div>

              <div>
                <Text className="text-xs font-extrabold text-slate-800 m-0 uppercase tracking-widest">
                  5. Observaciones relevantes
                </Text>
                <Text className="text-xs text-slate-700 mt-1 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  {observaciones}
                </Text>
              </div>
            </Section>

            <Hr className="border-slate-200 my-6" />

            {/* CTA */}
            <Section className="text-center mt-6">
              <Link
                href="http://localhost:3000"
                className="inline-block bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl shadow-md hover:bg-emerald-700 transition-all text-center decoration-none"
              >
                Acceder al Historial Clínico
              </Link>
            </Section>

            {/* Footer */}
            <Section className="mt-8 text-center">
              <Text className="text-[10px] text-slate-400 m-0">
                Este correo fue generado automáticamente por el Registro Inteligente de Talita Kum.
              </Text>
              <Text className="text-[10px] text-slate-400 m-0 mt-1">
                Por favor, no respondas a este mensaje.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
export default AlertaClinicaEmail;
