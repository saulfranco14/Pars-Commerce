import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.NEXT_PUBLIC_SENDGRID_API_KEY!);

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: {
    email: string;
    name: string;
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  from = {
    email: "saul.franco1420@gmail.com",
    name: "Pars Commerce",
  },
}: SendEmailParams) {
  try {
    await sgMail.send({
      to,
      from,
      subject,
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error("SendGrid error:", error.response?.body || error);
    throw new Error(error.message || "Error al enviar el correo");
  }
}
