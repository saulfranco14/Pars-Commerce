import { sendEmail } from "@/lib/email/sendgrid";

export async function sendAssistedOnboardingEmail(input: {
  email: string;
  ownerName: string;
  businessName: string;
  invitationUrl: string;
}) {
  const safeName = input.ownerName || "Hola";
  return sendEmail({
    to: input.email,
    subject: `Activa ${input.businessName} en Tlaco`,
    html: `<p>Hola ${safeName},</p><p>Tu negocio <strong>${input.businessName}</strong> ya está preparado en Tlaco.</p><p><a href="${input.invitationUrl}">Crear contraseña y activar mi acceso</a></p><p>Si no solicitaste este acceso, puedes ignorar este correo.</p>`,
  });
}
