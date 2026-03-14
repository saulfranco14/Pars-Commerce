export const confirmationEmailTemplate = (confirmUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Confirma tu cuenta - Pars Commerce</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Wrapper principal -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Container principal -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header con gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Pars Commerce</h1>
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Título -->
              <h2 style="margin: 0 0 20px 0; color: #292524; font-size: 24px; font-weight: 600;">¡Confirma tu cuenta!</h2>
              
              <!-- Saludo -->
              <p style="margin: 0 0 20px 0; color: #78716c; font-size: 16px; line-height: 1.6;">Hola,</p>
              
              <!-- Mensaje principal -->
              <p style="margin: 0 0 20px 0; color: #78716c; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte en <strong style="color: #ec4899; font-weight: 600;">Pars Commerce</strong>. Estamos emocionados de tenerte con nosotros.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #78716c; font-size: 16px; line-height: 1.6;">
                Para completar tu registro y activar tu cuenta, por favor confirma tu dirección de correo electrónico haciendo clic en el botón de abajo:
              </p>
              
              <!-- Botón CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmUrl}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="24%" strokecolor="#ec4899" fillcolor="#ec4899">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Confirmar mi cuenta</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${confirmUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.3);">
                      Confirmar mi cuenta
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              
              <!-- Nota de seguridad -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #ec4899; border-radius: 8px; margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 14px; color: #57534e; line-height: 1.5;">
                      <strong>🔒 Nota de seguridad:</strong> Este enlace expirará en 24 horas por tu seguridad. Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 30px 0;">
                    <div style="height: 1px; background-color: #f5f5f4;"></div>
                  </td>
                </tr>
              </table>
              
              <!-- Link alternativo -->
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #78716c;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 0; font-size: 14px; color: #ec4899; word-break: break-all;">
                <a href="${confirmUrl}" target="_blank" style="color: #ec4899; text-decoration: underline;">${confirmUrl}</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf9f7; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 5px 0; color: #292524; font-size: 14px; font-weight: 600;">Pars Commerce</p>
              <p style="margin: 0 0 15px 0; color: #78716c; font-size: 14px;">Tu plataforma de comercio electrónico</p>
              <p style="margin: 0; color: #78716c; font-size: 14px;">© 2025 Pars Commerce. Todos los derechos reservados.</p>
            </td>
          </tr>
          
        </table>
        <!-- Fin container principal -->
        
      </td>
    </tr>
  </table>
  <!-- Fin wrapper principal -->
  
</body>
</html>
`;

// =============================================================================
// LOAN PAYMENT CONFIRMATION
// =============================================================================

export type LoanPaymentEmailData = {
  businessName: string
  customerName: string
  amountPaid: number
  amountPending: number
  concept: string
  paymentMethod: string
  isFullyPaid: boolean
  isBulk?: boolean
}

export function loanPaymentConfirmationTemplate(data: LoanPaymentEmailData): string {
  const { businessName, customerName, amountPaid, amountPending, concept, paymentMethod, isFullyPaid, isBulk } = data
  const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
  const methodLabel: Record<string, string> = {
    efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta',
    mercadopago: 'MercadoPago', otro: 'Otro',
  }
  const methodText = methodLabel[paymentMethod] ?? paymentMethod

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago recibido - ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 32px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600;">${businessName}</h1>
              <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Comprobante de pago</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 36px 30px;">
              <h2 style="margin: 0 0 8px 0; color: #292524; font-size: 22px; font-weight: 600;">
                ${isFullyPaid ? '¡Préstamo liquidado!' : 'Pago recibido'}
              </h2>
              <p style="margin: 0 0 24px 0; color: #78716c; font-size: 16px; line-height: 1.6;">
                Hola <strong>${customerName}</strong>, ${isFullyPaid
                  ? 'tu préstamo ha sido liquidado en su totalidad. ¡Gracias!'
                  : 'recibimos tu pago correctamente.'}
              </p>

              <!-- Resumen de pago -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background-color: #faf9f7; border-radius: 10px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px 0; color: #78716c; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                      ${isBulk ? 'Pagos realizados' : 'Detalle del pago'}
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; color: #57534e; font-size: 15px;">${isBulk ? 'Préstamos liquidados' : 'Concepto'}</td>
                        <td style="padding: 6px 0; color: #292524; font-size: 15px; text-align: right; font-weight: 500;">${concept}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #57534e; font-size: 15px;">Monto pagado</td>
                        <td style="padding: 6px 0; color: #16a34a; font-size: 15px; text-align: right; font-weight: 600;">${fmtMXN(amountPaid)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #57534e; font-size: 15px;">Método de pago</td>
                        <td style="padding: 6px 0; color: #292524; font-size: 15px; text-align: right;">${methodText}</td>
                      </tr>
                      ${!isFullyPaid ? `
                      <tr>
                        <td colspan="2" style="padding: 12px 0 0 0;">
                          <div style="height: 1px; background-color: #e7e5e4;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 6px 0; color: #57534e; font-size: 15px; font-weight: 600;">Saldo pendiente</td>
                        <td style="padding: 12px 0 6px 0; color: #dc2626; font-size: 16px; text-align: right; font-weight: 700;">${fmtMXN(amountPending)}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              ${isFullyPaid ? `
              <!-- Badge de pagado -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background-color: #dcfce7; border-radius: 10px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 16px 24px; text-align: center;">
                    <p style="margin: 0; color: #15803d; font-size: 16px; font-weight: 600;">
                      Cuenta completamente saldada
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin: 0; color: #a8a29e; font-size: 13px;">
                Si tienes alguna duda, contacta directamente a ${businessName}.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #faf9f7; padding: 24px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 4px 0; color: #292524; font-size: 13px; font-weight: 600;">${businessName}</p>
              <p style="margin: 0; color: #a8a29e; font-size: 12px;">Powered by Pars Commerce</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// =============================================================================
// LOAN CARD FAILED — Aviso de fallo de cobro automático
// =============================================================================

export type LoanCardFailedEmailData = {
  businessName: string
  customerName: string
  amountPending: number
  concept: string
}

export function loanCardFailedTemplate(data: LoanCardFailedEmailData): string {
  const { businessName, customerName, amountPending, concept } = data
  const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Problema con tu pago - ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 32px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600;">${businessName}</h1>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 36px 30px;">
              <h2 style="margin: 0 0 8px 0; color: #292524; font-size: 22px; font-weight: 600;">No pudimos procesar tu pago</h2>
              <p style="margin: 0 0 24px 0; color: #78716c; font-size: 16px; line-height: 1.6;">
                Hola <strong>${customerName}</strong>, tuvimos un problema al procesar el cobro automático de tu tarjeta.
              </p>

              <!-- Detalle -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px; font-weight: 600;">Pago pendiente</p>
                    <p style="margin: 0 0 4px 0; color: #57534e; font-size: 15px;">Concepto: <strong>${concept}</strong></p>
                    <p style="margin: 0; color: #57534e; font-size: 15px;">Saldo pendiente: <strong style="color: #dc2626;">${fmtMXN(amountPending)}</strong></p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; color: #78716c; font-size: 15px; line-height: 1.6;">
                Para regularizar tu cuenta, tienes las siguientes opciones:
              </p>
              <ul style="margin: 0 0 24px 0; padding: 0 0 0 20px; color: #57534e; font-size: 15px; line-height: 2;">
                <li>Contacta a ${businessName} para obtener un nuevo link de pago</li>
                <li>Realiza el pago en efectivo directamente</li>
                <li>Proporciona una nueva tarjeta para el cobro automático</li>
              </ul>

              <p style="margin: 0; color: #a8a29e; font-size: 13px;">
                Si ya realizaste el pago por otro medio, ignora este mensaje.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #faf9f7; padding: 24px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 4px 0; color: #292524; font-size: 13px; font-weight: 600;">${businessName}</p>
              <p style="margin: 0; color: #a8a29e; font-size: 12px;">Powered by Pars Commerce</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// =============================================================================

export const resetPasswordEmailTemplate = (recoveryUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Restablece tu contraseña - Pars Commerce</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Pars Commerce</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #292524; font-size: 24px; font-weight: 600;">Restablece tu contraseña</h2>
              <p style="margin: 0 0 20px 0; color: #78716c; font-size: 16px; line-height: 1.6;">Hola,</p>
              <p style="margin: 0 0 20px 0; color: #78716c; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color: #ec4899; font-weight: 600;">Pars Commerce</strong>.
              </p>
              <p style="margin: 0 0 30px 0; color: #78716c; font-size: 16px; line-height: 1.6;">
                Haz clic en el botón de abajo para crear una nueva contraseña segura:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${recoveryUrl}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="24%" strokecolor="#ec4899" fillcolor="#ec4899">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Restablecer contraseña</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${recoveryUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.3);">
                      Restablecer contraseña
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #ec4899; border-radius: 8px; margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 14px; color: #57534e; line-height: 1.5;">
                      <strong>Nota de seguridad:</strong> Este enlace expirará en 1 hora por tu seguridad. Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 30px 0;">
                    <div style="height: 1px; background-color: #f5f5f4;"></div>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #78716c;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 0; font-size: 14px; color: #ec4899; word-break: break-all;">
                <a href="${recoveryUrl}" target="_blank" style="color: #ec4899; text-decoration: underline;">${recoveryUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #faf9f7; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 5px 0; color: #292524; font-size: 14px; font-weight: 600;">Pars Commerce</p>
              <p style="margin: 0 0 15px 0; color: #78716c; font-size: 14px;">Tu plataforma de comercio electrónico</p>
              <p style="margin: 0; color: #78716c; font-size: 14px;">© 2025 Pars Commerce. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
