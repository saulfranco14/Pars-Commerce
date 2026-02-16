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
