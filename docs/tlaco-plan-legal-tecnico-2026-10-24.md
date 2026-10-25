# Tlaco: plan jurídico y técnico para contratación SaaS, privacidad y salida de datos

Fecha de revisión: 24 de octubre de 2026.  
Repositorio: saulfranco14/Pars-Commerce, rama master, commit `3f15efb27e1c464ef9c52cae84b177a8865d1932`.

## Alcance y conclusión

Este documento combina una revisión estática dirigida del repositorio con fuentes oficiales mexicanas. Propone producto, arquitectura, evidencias y ejemplos de redacción; no es un contrato listo para firmarse ni una opinión jurídica vinculante. Antes de publicar las cláusulas, un abogado mexicano debe revisar especialmente aplicabilidad de protección al consumidor, límites de responsabilidad, titularidad del software y conservación por categoría.

No se modificaron código, configuración, datos, visibilidad del repositorio ni términos publicados. No se accedió a las consolas de Supabase, Vercel o Mercado Pago. La herramienta de consulta no pudo abrir tlaco.app; por tanto, los hallazgos describen el commit revisado, no certifican lo desplegado.

La protección buscada requiere cuatro piezas que se apoyan mutuamente:

1. Un acuerdo coherente con lo que Tlaco realmente ofrece.
2. Evidencia atribuible de las condiciones que aceptó cada parte.
3. Una operación capaz de cumplir seguridad, cobros, recuperación y cancelación.
4. Una salida de datos que funcione, con eliminación y conservación justificadas.

No existe una lista legal de “tres cláusulas que blindan todo SaaS”. Tampoco es necesario convertir cada compra en una firma complicada. La contratación del comerciante y la compra de su cliente son relaciones distintas.

## 1. Hallazgos del proyecto

Las referencias de esta tabla están fijadas al commit revisado. “No identificado” significa que no se encontró en los flujos y archivos inspeccionados; no demuestra que no exista un procedimiento manual o infraestructura externa.

| Prioridad | Evidencia | Hallazgo | Acción propuesta |
|---|---|---|---|
| Alta | [terms.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/features/legal/constants/terms.ts) | Describe el servicio, pero no desarrolla expresamente la licencia del software ni la ausencia de entrega de fuente. | Incorporar alcance de acceso, licencia, usuarios autorizados, titularidad y desarrollos a medida. |
| Alta | terms.ts, apartado de precios | Presenta los planes pagados como futuros; el código ya incluye contratación recurrente. | Conciliar documentos, planes efectivamente ofrecidos y funcionamiento desplegado. |
| Alta | terms.ts, disponibilidad | Tope equivalente a los últimos 12 meses pagados; con plan gratuito puede resultar cero. | No tratarlo como exoneración universal; analizar régimen aplicable y exclusiones permitidas. |
| Alta | terms.ts, cancelación | Promete exportar antes del cierre sin precisar paquete, plazo, mecanismo o límites. | Implementar y documentar una salida completa. |
| Alta | [privacy.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/features/legal/constants/privacy.ts) | Remite al INAI como autoridad. | Actualizar a la autoridad competente bajo la ley vigente. |
| Alta | privacy.ts | Ya distingue negocio responsable y Tlaco encargado. | Conservar esa base y convertirla en instrucciones y obligaciones contractuales verificables. |
| Alta | [registro/page.tsx](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/app/registro/page.tsx) | Hay enlaces y texto de aceptación al continuar; no se transmite versión contractual ni aceptación específica. | Añadir aceptación explícita y expediente de evidencia del lado servidor. |
| Alta | [send-confirmation/route.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/app/api/auth/send-confirmation/route.ts) | Crea usuarios con `email_confirm: true`. | Separar aprobación administrativa de prueba de control del correo. |
| Alta | [customerIdentity.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/lib/customers/customerIdentity.ts) | Asigna `identity_consent_at` al insertar cliente; el endpoint no recibe aceptación ni versión. | No usar ese campo como prueba suficiente de consentimiento informado. |
| Alta | [billingService.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/features/billing/billingService.ts) | Existe cancelación de autorización en Mercado Pago y transición a Gratis. | Reutilizarla; distinguir cancelación de membresía, cierre de negocio y eliminación personal. |
| Alta | billingService.ts | Un pago duplicado con error 23505 no impide continuar actualizando la cuenta a activa y limpiar cancelación. | Probar y corregir idempotencia y orden de eventos antes de reforzar promesas contractuales. |
| Alta | billingService.ts | Al cambiar plan, si falla cancelar autorización anterior, registra advertencia y continúa creando otra. | Evitar autorizaciones simultáneas sin reconciliación; no dar por cancelada una autorización incierta. |
| Media/alta | [reports/export/route.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/app/api/reports/export/route.ts) | Exporta ventas/comisiones en PDF/XLSX; no es una exportación integral de salida. | Crear paquete estructurado con catálogo, clientes, órdenes, pagos y archivos autorizados. |
| Media | [profile/route.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/app/api/profile/route.ts) | Guarda nombre visible, teléfono y avatar; no contiene identidad del contratante ni facultades. | Separar perfil editable de parte contractual e identidad verificada. |
| Media | [acquisition.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/lib/acquisition.ts) | Atribución de campañas en localStorage con TTL de 30 días. | Inventariar tecnologías y finalidades; el aviso no debería describir únicamente sesión y preferencias. |
| Media | [tenant-site-pages/route.ts](https://github.com/saulfranco14/Pars-Commerce/blob/3f15efb27e1c464ef9c52cae84b177a8865d1932/src/app/api/tenant-site-pages/route.ts) | Existen páginas editables del negocio, pero una edición reemplaza contenido. | Aprovecharlas para avisos del comerciante; conservar versiones aceptadas por compradores. |
| Alta | Metadatos GitHub | Repositorio público. No se encontró archivo LICENSE en el árbol consultado. | Decidir estrategia de exposición y derechos. No cambiar visibilidad sin revisar integraciones y colaboradores. |
| Pendiente | Operación externa | No se verificaron backups, restauraciones, regiones, contratos con proveedores ni plan contratado. | Inventario operativo y ensayo de recuperación antes de publicar RPO/RTO o SLA. |

Los dos hallazgos de billing son riesgos deducidos del código, no incidentes demostrados en producción. Requieren pruebas con eventos duplicados, tardíos y fallos del proveedor.

La fecha compartida `LEGAL_UPDATED_AT` tampoco sustituye una versión inmutable por documento. Una actualización del aviso no debe sobrescribir qué contrato había aceptado una persona.

## 2. Qué dicen las normas y cómo interpretarlas

### Software y propiedad intelectual

La Ley Federal del Derecho de Autor protege el software; conviene revisar artículos 5, 30 y 101–106. Pagar acceso SaaS no supone por sí solo cesión ni entrega de código. La titularidad sí depende de autoría, contratos, relaciones laborales y componentes de terceros. Registrar la obra puede reforzar documentación, pero no crea automáticamente derechos sobre código ajeno. [F1]

Para Tlaco, documentar por separado: software propio, aportaciones de colaboradores, dependencias, marca, contenido del comerciante y cualquier desarrollo exclusivo negociado. Un encargo de personalización merece un anexo sobre derechos y entregables.

Un repositorio público no equivale automáticamente a software libre. GitHub explica que, sin licencia, aplican derechos de autor por defecto, aunque publicar permite visualización y forks conforme a sus términos. Ponerlo privado después no recupera copias anteriores. [F8]

### Servicio, daños y límites

El Código Civil Federal regula incumplimiento y daños en los artículos 2104–2117; no establece un porcentaje universal de disponibilidad para todo SaaS. El dolo no puede exonerarse y el caso fortuito requiere analizar sus circunstancias. Un límite contractual puede regular riesgos donde la ley lo permita; una caída del proveedor no es automáticamente fuerza mayor. El régimen mercantil y las reglas imperativas deben examinarse conjuntamente. [F2]

Ejemplo práctico: si se promete “ningún dato puede perderse”, un anexo que habla de backups diarios no hace desaparecer esa contradicción. La publicidad, el soporte y el contrato deben sostener la misma oferta.

### Consumidores y suscripciones

La LFPC exige analizar quién es consumidor: vender a negocios no excluye automáticamente su aplicación. Los artículos 85–90 limitan cláusulas abusivas de adhesión; un tope no puede anular derechos irrenunciables. El registro ante Profeco no es universal para todo contrato SaaS: debe revisarse la actividad y regulación específica. [F3, F11]

Profeco confirma para suscripciones digitales el consentimiento expreso e informado de cargos recurrentes, aviso de renovación automática con al menos cinco días naturales y cancelación sencilla. Diseñar Tlaco con ese estándar también reduce disputas en relaciones empresariales. [F10]

### Datos personales

La LFPDPPP expedida en 2025 es la referencia actual; la autoridad es la Secretaría Anticorrupción y Buen Gobierno. Los artículos 5–16 cubren principios, información y consentimiento; 18–20, seguridad e incidentes; 21–34, ARCO. El artículo 31 fija respuesta en 20 días hábiles y ejecución procedente en 15, con ampliación justificada prevista en la ley. Los datos financieros y sensibles tienen exigencias específicas. Cancelación puede implicar bloqueo y conservación justificada, no borrado indiscriminado. [F4]

Los artículos 49–54 del Reglamento desarrollan la relación responsable/encargado; el 52 contempla recuperación y posterior supresión en servicios de nube. Debe aplicarse en lo compatible con la ley vigente. Esto sustenta una salida útil, aunque no deba confundirse con importar íntegramente un derecho de portabilidad del RGPD europeo. [F5]

### Aceptación y conservación electrónica

El Código de Comercio, artículos 49, 80, 89–93 y 97, permite contratación electrónica y exige atender atribución, integridad y consulta posterior. Un checkbox puede integrar la prueba; no es automáticamente firma electrónica avanzada. El artículo 49 contempla al menos diez años para documentos que consignan obligaciones comerciales, no para cualquier dato o evento de navegación. [F6]

La NOM-151-SCFI-2016 regula conservación de mensajes de datos. Un hash en la misma base editable no equivale a una constancia emitida mediante PSC. Su cumplimiento debe resolverse para el expediente mercantil aplicable; no confundir conservación con validez de todas las cláusulas o identificación plena del firmante. [F7]

En materia fiscal, el artículo 30 del CFF contiene la regla general de cinco años y supuestos especiales. El plazo, punto de inicio y documentación concreta deben determinarlos jurídico y contador. [F12]

## 3. Paquete documental propuesto

Puede presentarse como un contrato principal con anexos accesibles. No hacen falta siete casillas ni siete firmas para siete archivos, si la incorporación es clara y se registra exactamente el conjunto aceptado.

| Documento | Objetivo | Parte o audiencia |
|---|---|---|
| Contrato de servicios SaaS y licencia de uso | Acceso, alcance, precio, propiedad, obligaciones y terminación | Tlaco y contratante del negocio |
| Ficha de contratación | Identidad, negocios cubiertos, plan, precio, impuestos, fechas, cobro | Tlaco y contratante |
| Anexo de tratamiento de datos | Instrucciones, categorías, proveedores, seguridad, incidentes y salida | Negocio responsable / Tlaco encargado |
| Política operativa o SLA | Disponibilidad medida, mantenimiento, soporte, recuperación y compensación aplicable | Contratante |
| Política de salida | Exportación, cierre, retención, eliminación y respaldos | Contratante |
| Aviso de privacidad de Tlaco | Tratamiento propio de cuentas, soporte, seguridad y facturación | Personas físicas involucradas |
| Condiciones de compra y aviso del negocio | Venta, entrega, devoluciones y tratamiento del comprador | Comerciante y comprador |

El aviso no debe presentarse como renuncia de derechos. La aceptación del servicio, la constancia de haber puesto el aviso a disposición, la autorización de cobros y la publicidad tienen significados distintos y deben persistirse como eventos distintos.

La identidad del prestador debe coincidir con quien realmente contrata, factura y opera. El repositorio actualmente identifica a Saúl Mauricio Franco Rentería; confirmar esa condición antes de generar contratos. “Tlaco” es la marca, no una sociedad automáticamente.

## 4. Diseño de experiencia: mínima fricción

### 4.1 Matriz de acciones

| Acción | Datos propuestos | Intervención |
|---|---|---|
| Ver landing, catálogo o demostración | Sin cuenta; datos técnicos estrictamente necesarios | Enlaces legales visibles; transparencia desde la captura técnica |
| Simular productos, precio o carrito | Datos ficticios o temporales | Sin firma; evitar guardar clientes reales en una demo compartida |
| Crear cuenta / guardar tienda en nube | Email, credencial de acceso; identificar contratante al activar negocio | Aviso de privacidad desde el alta y aceptación del alcance que ya empieza |
| Activar negocio, publicar o guardar primera operación real | Nombre legal, tipo de contratante, representación; contacto verificado | Contrato SaaS una sola vez por ámbito y versión |
| Agregar cliente desde panel | Solo datos necesarios para la operación | Contrato/DPA del negocio activo; herramienta para informar al cliente |
| Compra presencial ordinaria | Puede bastar folio o alias cuando sea viable | No exigir cuenta SaaS ni INE por defecto |
| Pedido de recogida | Nombre o alias y contacto si hace falta avisar | Condiciones del comerciante y aviso contextual |
| Entrega a domicilio | Contacto, domicilio de entrega; instrucciones necesarias | Pedir domicilio solo al seleccionar entrega |
| Contratar plan pagado de Tlaco | Plan, importe, moneda, impuestos y calendario | Autorización recurrente visible y separada |
| Cambiar datos bancarios / exportar todo / cerrar negocio | Identidad ya existente | Reautenticación proporcional al riesgo |
| Ver documentos, cancelar cobro, ARCO o exportar al salir | Identidad proporcional a la solicitud | Nunca exigir aceptar nuevos términos como condición |

Si el registro ya publica la tienda —como sugiere el código actual— no conviene esperar a la primera venta para autorizar publicación y condiciones SaaS. Alternativas: aceptar al guardar/publicar, o mantener un borrador privado hasta activación. La transición debe coincidir con el primer efecto real.

Los datos técnicos identificables pueden existir antes de escribir nombre o email. Por eso, “no hay cuenta” no significa necesariamente “no tratamos datos personales”.

### 4.2 Pantalla del dueño: guardar y activar

Propuesta de contenido, a validar jurídicamente:

**Guarda y activa tu negocio**

- Nombre comercial: Lavado Express.
- Contratante: persona física / persona moral.
- Nombre legal del contratante o razón social.
- Nombre del representante cuando corresponda.
- Email de contacto contractual.
- WhatsApp del negocio, indicando si se publicará.
- Plan seleccionado y costo; “Gratis, sin cargos automáticos” cuando aplique.

Casilla inicialmente vacía:

> Acepto el Contrato de servicios SaaS y licencia de uso de Tlaco y sus anexos. Declaro que puedo contratar por este negocio.

Debajo:

> Consulta cómo utilizamos tus datos en el Aviso de privacidad.

Ese enlace debe acompañar un aviso simplificado contextual; no sustituirlo. Diseño del bloque: identidad y domicilio real del responsable, categorías de datos de este formulario, finalidades necesarias y opcionales, medios para limitar uso/divulgación y enlace al aviso integral. Evitar comprimirlo a letra ilegible. En el checkout, el responsable y domicilio deben ser los del negocio correspondiente para el tratamiento que le compete. [F4]

Ejemplo estructural para completar: “[Responsable y domicilio] utiliza [datos de este formulario] para [finalidades concretas]. Las promociones son opcionales. Puedes limitar su uso en [control o canal]. Consulta el aviso integral en [enlace]”. Las categorías deben incluir datos técnicos si se recaban; no afirmar que no hay datos sensibles sin revisar campos y módulos.

Casilla independiente y opcional:

> Quiero recibir novedades y promociones de Tlaco.

Botón:

> Guardar y activar mi negocio

La casilla debe enlazar al documento y anexos concretos. El modal o panel de lectura conserva el borrador, ofrece descarga y es accesible por teclado. No hace falta obligar a desplazarse hasta el último párrafo; ese gesto tampoco demuestra lectura.

### 4.3 Verificación sin perder el trabajo

Propuesta:

1. Permitir explorar y preparar datos.
2. Crear cuenta con estado explícito de control de contacto pendiente.
3. Verificar por código de un solo uso o enlace limitado antes de activar operaciones sensibles y completar el expediente.
4. Mantener el borrador si correo o red fallan.
5. Reanudar la acción original una vez, con idempotencia.

No reutilizar `email_confirmed_at` como evidencia histórica de verificación si procede del alta administrativa. Registrar método, destino, fecha, identificador del desafío y resultado; nunca guardar OTP en claro. Un correo relay puede ser legítimo: hay que probar su control, no rechazarlo por apariencia.

### 4.4 Perfil de la captura

La pantalla “Mi perfil” puede seguir siendo ligera. Agregar un acceso secundario a **Datos legales y contratos**.

Separar:

- `display_name`: alias editable.
- `legal_party_name`: contratante.
- `representative_name`: quien actúa.
- `private_contact_phone`: contacto privado de cuenta.
- `public_business_phone`: contacto que se publica.
- `verified_contact`: evidencia de control.

Cambiar el alias no reescribe contratos. Cambiar de razón social o propietario puede requerir sustitución de parte, aceptación nueva y validación de facultades. No modificar retrospectivamente el PDF anterior.

### 4.5 Comprador final

No pedirle aceptar el contrato con el que el comerciante usa Tlaco.

Texto propuesto antes de confirmar:

> Tu pedido lo vende y atiende [nombre legal/comercial del negocio]. Consulta sus condiciones de compra y su aviso de privacidad.

Casilla de compra:

> Acepto las condiciones de este pedido.

Cuando haya cobro recurrente:

> Autorizo el cargo de [importe y moneda], cada [periodo], a partir de [fecha]. Puedo cancelar desde [ruta].

Consentimiento opcional distinto:

> Quiero recibir promociones de [negocio].

Compra en efectivo o transferencia conserva la misma claridad del pedido, aunque no exista mandato de tarjeta. Si el negocio ofrece crédito, el contrato de ese crédito debe corresponder al acreedor real.

No convertir teléfonos o huellas de dispositivo en identificación fuerte: pueden compartirse, reciclarse o falsificarse. Para recuperar historial privado, fusionar cuentas o acceder a crédito se requiere una comprobación adicional adecuada.

## 5. Evidencia y firma: diseño verificable

### 5.1 Expediente recomendado

Guardar del lado servidor:

- Identificador del contrato y de su expediente.
- Versión y contenido exacto del contrato, anexos y ficha económica.
- Hash de cada artefacto y manifiesto completo.
- Parte prestadora, contratante, representante y negocios cubiertos.
- Identificador de usuario y rol comprobado en ese momento.
- Declaración de representación que se mostró.
- Método de autenticación y de control de contacto.
- Instante de aceptación generado por servidor; UTC y zona mostrada.
- Texto exacto de la casilla y etiqueta del botón.
- Versión de interfaz y punto de entrada.
- Referencia al consentimiento recurrente, si aplica.
- IP y metadatos de seguridad solo si se justifica su necesidad; acceso y retención específicos.
- Eventos de emisión, entrega, acceso a copia y conservación.
- Constancia PSC y elementos necesarios para validarla cuando se integren.

No almacenar contraseñas, cookies de sesión, tokens OAuth, claves privadas del firmante ni OTP en el expediente.

### 5.2 Firma del prestador

Publicar una imagen de la firma de Saúl no acredita por sí mismo una firma digital ni autorización particular.

Diseño propuesto:

1. Aprobación de la versión contractual por el prestador autorizado.
2. Oferta identificada y versionada.
3. Aceptación del negocio atribuible a su usuario.
4. Emisión de la ficha y comprobante contractual.
5. Firma electrónica del prestador mediante mecanismo autorizado cuando se decida incorporarla.
6. Conservación de la evidencia completa.

Si se necesita firma de ambas partes con certificados, contratar un flujo que la soporte. No confundir el sello del proveedor tecnológico con firma personal de Saúl. La herramienta no debe afirmar “firmado digitalmente por el propietario” si solo escribió su nombre.

La e.firma del SAT no tiene por qué exigirse en cada venta pequeña. No pedir archivos .key ni su contraseña para un onboarding básico.

### 5.3 Integridad y costos

Un hash ayuda a detectar cambios solo si hay una referencia confiable. Si alguien con privilegios puede reemplazar archivo y hash, la protección es limitada.

Propuesta: objetos inmutables, control de acceso separado, historial de auditoría protegido y conservación externa mediante PSC. El expediente original debe mantenerse, además de la constancia.

El costo real depende de volumen y proveedor de certificación. Solicitar cotización por contrato, renovación y conservación; no prometer costo cero ni cumplimiento NOM-151 basado exclusivamente en una tabla Postgres.

Si falla el envío de copia o la constancia, registrar el estado pendiente y reintentar. No obligar a aceptar otra vez ni mostrar certificación inexistente.

## 6. Ejemplos de cláusulas para revisión jurídica

Son borradores de diseño. Corchetes indican decisiones pendientes; no deben publicarse sin completar y revisar.

### Licencia y titularidad

> Durante la vigencia del contrato, [Prestador] concede al Contratante una licencia limitada, no exclusiva y no transferible, salvo autorización expresa, para acceder y utilizar las funcionalidades de Tlaco incluidas en el plan contratado mediante sus usuarios autorizados. La contratación no comprende venta, cesión de derechos patrimoniales ni entrega del código fuente. Los derechos sobre el software propio permanecen con sus titulares. Los componentes de terceros se sujetan a sus licencias aplicables. Los desarrollos y entregables especiales requerirán un acuerdo separado que determine expresamente su titularidad y alcance.

No usar “revocable en cualquier momento por cualquier motivo”: especificar incumplimiento, seguridad, requerimiento legal y procedimiento de suspensión, con medidas proporcionales.

### Contenido y datos del negocio

> El Contratante conserva los derechos que legalmente le correspondan sobre los materiales que incorpora. Autoriza su alojamiento, procesamiento y publicación únicamente en la medida necesaria para las funciones que habilite. Los datos personales se tratarán conforme al anexo de tratamiento y a los derechos de sus titulares. Esta autorización no faculta al Prestador para venderlos ni utilizarlos para publicidad ajena al servicio contratado.

“Los clientes son propiedad del negocio” es una formulación inadecuada. Las personas conservan derechos sobre su información.

### Disponibilidad y operación

> El alcance del servicio, métricas de disponibilidad, ventanas de mantenimiento, canales y horarios de soporte, procedimientos de recuperación y remedios aplicables se establecen en el anexo operativo [versión]. El Prestador informará interrupciones relevantes y ejecutará medidas razonables de mitigación y recuperación. Las exclusiones deberán corresponder a hechos acreditables y no eliminarán obligaciones que legalmente resulten exigibles.

El anexo debe estar disponible al aceptar, no añadirse después.

### Responsabilidad

> Para los supuestos en que la legislación permita limitar la responsabilidad, las partes acuerdan [alcance y monto evaluados jurídicamente]. La limitación no comprenderá dolo ni supuestos cuya exclusión o limitación prohíba la legislación aplicable. No restringirá derechos irrenunciables, devoluciones o compensaciones legalmente exigibles.

No se propone un monto como legalmente seguro. “12 meses pagados” requiere análisis de cliente, riesgo, plan gratuito y servicios afectados. Puede evaluarse un límite base distinto para planes gratuitos y excepciones específicas, sin presentarlos como automáticamente válidos.

### Salida y borrado

> Al solicitar el cierre del negocio, el Contratante contará con un mecanismo de recuperación de su información en [formatos y alcance]. Se le informará el calendario aplicable de desactivación, recuperación, supresión de datos operativos y caducidad de respaldos. Se conservarán exclusivamente las categorías justificadas por obligaciones legales o defensa de derechos, con acceso restringido y por el plazo aplicable. La cancelación de la membresía no implica por sí misma cierre del negocio ni supresión de información.

Especificar quién solicita, método de comprobación, canales alternativos y tratamiento de pagos pendientes.

### Recurrentes

> Antes de autorizar un cobro recurrente se mostrará importe total, moneda, periodicidad, fecha de inicio, mecanismo de renovación y forma de cancelación. La autorización se conservará separadamente de la aceptación general. Las modificaciones que requieran nueva autorización no se aplicarán mediante un consentimiento histórico genérico.

### Datos como encargado

> El Prestador tratará los datos de clientes del Contratante conforme a sus instrucciones documentadas y para prestar las funcionalidades contratadas. El anexo identificará categorías, finalidades, medidas de seguridad, subencargados, asistencia ante solicitudes, incidentes y reglas de devolución o supresión. Las finalidades propias del Prestador se identificarán separadamente cuando existan.

## 7. Disponibilidad, respaldos y pérdida de datos

### 7.1 No prometer números antes de medir

Ejemplos matemáticos sobre 30 días, no garantías actuales:

| Disponibilidad | Indisponibilidad aproximada equivalente |
|---|---:|
| 99 % | 7 h 12 min |
| 99.5 % | 3 h 36 min |
| 99.9 % | 43 min 12 s |

Definir qué se mide: acceso al panel, creación de pedidos, catálogo público y pagos tienen dependencias diferentes. Un HTML que responde 200 no prueba que pueda guardarse una venta.

RPO: antigüedad máxima objetivo de los datos recuperables. RTO: tiempo objetivo para restablecer el servicio. Ninguno es una promesa razonable si nunca se ha restaurado.

Propuesta inicial interna, pendiente de validación: medir durante un ciclo operativo, ensayar restauración y después decidir qué compromiso contractual puede sostener el presupuesto. Un backup diario puede dejar hasta aproximadamente un día de operaciones expuestas; no es equivalente a recuperación de minutos.

### 7.2 Cobertura de recuperación

Inventariar:

- Base de datos, migraciones, funciones y políticas RLS.
- Objetos de Storage: imágenes, documentos y comprobantes.
- Configuración de aplicación y secretos recuperables desde un almacén seguro.
- Identidad, usuarios, permisos y dependencias de Auth.
- Integraciones de pagos y eventos necesarios para reconciliación.
- Contratos, anexos, pruebas y constancias.
- Registro de supresiones y retenciones vigentes.

Supabase advierte que los backups de base de datos no incluyen los objetos de Storage. Tampoco puede asumirse la política del plan Pro si el proyecto es Free. [F9]

Implementar copia independiente cifrada cuando sea adecuada, credenciales separadas, alerta de fallos, verificación de integridad y pruebas de restauración. Un job “verde” sin recuperar y reconciliar datos no prueba continuidad.

### 7.3 Respuesta a incidentes propuesta

1. Detectar y registrar alcance conocido.
2. Contener el acceso o el error; preservar evidencia necesaria.
3. Identificar negocios y titulares afectados.
4. Evaluar datos y obligaciones de comunicación con responsable jurídico.
5. Avisar al negocio sin demora conforme al DPA y facilitar la notificación necesaria.
6. Restaurar en entorno aislado; validar saldos, órdenes y permisos.
7. Reconciliar pagos externos antes de reactivar cargos.
8. Revisar causa y medidas correctivas.

No importar automáticamente una regla de 72 horas del RGPD como si fuera el plazo mexicano general.

Restaurar un backup no debe resucitar usuarios eliminados ni reanudar suscripciones canceladas. Aplicar el registro vigente de supresiones y estados de cobro antes de abrir tráfico.

## 8. Cancelación, recuperación y eliminación

### 8.1 Tres solicitudes distintas

| Solicitud | Resultado esperado |
|---|---|
| Cancelar membresía de Tlaco | Detener renovaciones; aplicar derecho de uso del periodo pagado conforme a la oferta y pasar a Gratis si procede |
| Cerrar un negocio | Desactivar operación pública, revocar accesos del negocio y ejecutar calendario de salida |
| Eliminar cuenta personal / ejercer ARCO | Evaluar datos de esa persona, negocios asociados, facultades y retenciones aplicables |

No borrar todos los negocios porque un colaborador elimina su cuenta. Si un propietario administra varios, elegir alcance explícitamente. Si el propietario es único, resolver transferencia de administración o cierre informado.

### 8.2 Calendario de producto ilustrativo

Los plazos de 30 días y las ventanas técnicas siguientes son propuestas para evaluar, no plazos universales de ley.

| Momento | Acción |
|---|---|
| Solicitud | Acuse con folio; detener nuevas renovaciones según solicitud; registrar alcance |
| Mismo flujo | Ofrecer exportación y explicar datos retenidos; no condicionar la baja a descargar |
| Inicio de cierre efectivo | Despublicar o dejar información apropiada para pedidos pendientes; revocar dispositivos y enlaces sensibles |
| Ventana propuesta de hasta 30 días | Acceso restringido a consulta/exportación si corresponde; recordatorio antes del final |
| Fin de ventana | Suprimir datos operativos elegibles, archivos y accesos |
| Ciclo de respaldos documentado | Expirar copias conforme al periodo realmente aprobado y probado |
| Cierre del expediente | Comprobante de acciones realizadas, excepciones y fechas pendientes |

Una solicitud ARCO sigue su propio análisis y calendario legal. No debe retrasarse por adoptar una ventana comercial de recuperación. Si una exportación falla, no disparar automáticamente el borrado destructivo; resolver la incidencia sin convertirla en retención indefinida.

Si se conserva un archivo por litigio, identificar categoría, fundamento, responsable de revisión y fecha de próxima evaluación. No conservar la base completa “por si acaso”.

### 8.3 Exportación útil

ZIP con manifiesto y formatos abiertos propuestos:

- `business.json`
- `products.csv`
- `services.csv`
- `customers.csv`
- `orders.csv`
- `order_items.csv`
- `payments.csv`
- `subscriptions.csv`
- `credits.csv` cuando aplique
- `files/` con objetos que tenga derecho a recuperar
- `schema.json` con relaciones, unidades y zona horaria
- `manifest.json` con conteos y hashes
- `README.txt` con alcance, campos y exclusiones

Aplicar snapshot coherente, paginación y comprobaciones de conteo; no truncar al límite predeterminado de consultas. No incluir credenciales, tarjetas, claves de pago, datos de otros negocios ni secretos internos.

El export completo del negocio y el acceso ARCO individual son productos distintos. No entregar una exportación de todos los clientes a quien solicita solo sus propios datos.

Propuesta de seguridad: reautenticación para exportación total, permiso específico, enlace firmado de corta duración, descarga auditada, caducidad del ZIP. Un enlace de 24 horas es una decisión de diseño, no una exigencia legal.

### 8.4 Matriz de retención pendiente de aprobación

| Categoría | Criterio de diseño |
|---|---|
| Datos ficticios de demo | TTL corto; nunca mezclarlos con producción |
| Borradores abandonados | Plazo breve configurable y comunicado |
| Catálogo, imágenes y clientes operativos | Necesidad del servicio y proceso de salida |
| Contratos y evidencia mercantil | Clase documental y plazo aplicable; acceso separado |
| Facturación y documentación fiscal | Regla fiscal aplicable, eventos que inician plazo y excepciones |
| Logs de seguridad | Riesgo y necesidad demostrada; no diez años por defecto |
| Consentimientos de publicidad | Evidencia mínima y lista de exclusión necesaria |
| Disputas / órdenes de autoridad | Retención específica, revisión periódica |
| Respaldos | Caducidad cerrada, aislamiento y no uso ordinario |
| Exportaciones temporales | Caducidad propia, más corta que los datos originales |

No utilizar eliminación en cascada sobre el único expediente contractual. Tampoco bloquear toda eliminación por la existencia de una factura.

## 9. Arquitectura propuesta en TypeScript

Aprovechar `src/features/legal` para documentos públicos y añadir un módulo que gestione decisiones y casos de uso. No reestructurar todo el proyecto para este cambio.

### 9.1 Organización

| Capa | Elementos propuestos |
|---|---|
| `src/features/compliance/domain` | Tipos, políticas puras, estados y validaciones |
| `src/features/compliance/application` | Casos de uso de aceptación, autorización, exportación y cierre |
| `src/features/compliance/ports` | Repositorios, reloj, evidencia, verificación, correo y cobros |
| `src/features/compliance/infrastructure` | Adaptadores Supabase, almacenamiento, PSC y proveedores existentes |
| `src/features/compliance/ui` | Aceptación, visor, centro de contratos y salida |
| `src/app/api/legal` | Adaptadores HTTP delgados |
| `src/app/api/privacy` | Solicitudes ARCO y estado |
| `src/app/api/tenants/[id]/data-export` | Exportación integral |
| `src/app/api/tenants/[id]/closure` | Solicitud y estado de cierre |

Reglas puras sin importar Next, Supabase ni React. Casos de uso con dependencias inyectadas, sin acceso directo desde componentes a tablas de evidencia.

### 9.2 Modelo de datos propuesto

| Tabla / entidad | Campos esenciales |
|---|---|
| `legal_parties` | Tipo de parte, nombre legal, contacto, datos fiscales cuando correspondan |
| `legal_document_versions` | Tipo, versión, idioma, contenido inmutable, hash, vigencia, aprobador |
| `contract_offers` | Paquete documental, parte prestadora, alcance, precio, expiración |
| `legal_acceptances` | Oferta, contratante, representante, usuario, tenant/ámbito, fecha de servidor, evidencia |
| `contact_verifications` | Canal, destino, método, desafío, verificación y caducidad |
| `privacy_notice_events` | Versión presentada, contexto y titular/pseudónimo necesario |
| `purpose_consents` | Finalidad, otorgamiento/revocación, versión y origen |
| `recurring_mandates` | Importe, moneda, frecuencia, fechas, autorización externa, revocación |
| `evidence_artifacts` | URI privada, hash, versión, constancia PSC, estado |
| `privacy_requests` | Derecho, titular verificado, responsable, plazos, decisiones |
| `data_exports` | Solicitante, alcance, snapshot, conteos, ubicación, caducidad |
| `closure_requests` | Alcance, solicitud, fecha efectiva, estado, excepciones |
| `retention_holds` | Categoría, fundamento, revisión, vencimiento |
| `deletion_jobs` | Categorías, pasos, reintentos y comprobantes |
| `compliance_outbox` | Eventos que requieren correo, PSC o integración externa |

Los nombres son propuestos; deben ajustarse a migraciones y convenciones existentes. No están implementados.

### 9.3 Ejemplo de política funcional

```ts
type ProtectedAction =
  | "business.publish"
  | "customer.create"
  | "order.create"
  | "billing.subscribe";

type LegalState = Readonly<{
  acceptedContractVersion: string | null;
  requiredContractVersion: string;
  contactVerified: boolean;
  canRepresentBusiness: boolean;
}>;

type LegalDecision =
  | Readonly<{ allowed: true }>
  | Readonly<{
      allowed: false;
      reason:
        | "REPRESENTATION_REQUIRED"
        | "CONTACT_VERIFICATION_REQUIRED"
        | "LEGAL_ACCEPTANCE_REQUIRED";
    }>;

const evaluateLegalState = (state: LegalState): LegalDecision => {
  if (!state.canRepresentBusiness) {
    return { allowed: false, reason: "REPRESENTATION_REQUIRED" };
  }

  if (!state.contactVerified) {
    return { allowed: false, reason: "CONTACT_VERIFICATION_REQUIRED" };
  }

  if (state.acceptedContractVersion !== state.requiredContractVersion) {
    return { allowed: false, reason: "LEGAL_ACCEPTANCE_REQUIRED" };
  }

  return { allowed: true };
};
```

La comprobación real se hace con contexto de servidor. La variable de representación no debe confiar en un booleano arbitrario enviado por cliente. Aplicar políticas por actor: un empleado opera bajo el contrato ya aceptado por el dueño; no se le exige declararse representante.

Para usuarios existentes, la versión requerida debe reflejar el periodo de transición y la relación contractual vigente, no simplemente la última versión publicada. Exportación, cancelación, consulta legal y ARCO quedan fuera de este bloqueo.

### 9.4 Operación idempotente

Secuencia propuesta:

1. El servidor determina usuario, negocio, rol y acción.
2. Calcula documentos requeridos y crea oferta firmada o identificada con caducidad.
3. El navegador muestra resumen, enlaces y casillas.
4. La aceptación envía `offer_id`, elecciones explícitas e `idempotency_key`.
5. El servidor revalida facultades, contacto, oferta y documentos.
6. Una transacción registra aceptación y evento de salida.
7. Devuelve el identificador del expediente.
8. La operación original se ejecuta una vez con su propia idempotencia.
9. Un worker genera copia y tramita conservación/entrega.
10. Los fallos externos no borran el hecho de aceptación ni duplican ventas.

Si cambió la oferta, responder con un estado recuperable y mostrar diferencias sin perder formulario. No sustituir silenciosamente el contrato que el usuario vio.

### 9.5 Defensa del lado servidor y base de datos

- Guardas en endpoints, acciones de servidor y procesos de escritura.
- Revisar escrituras directas desde navegador y RPC; la UI no es frontera de autorización.
- RLS por tenant; service role solo en servidor y con verificación explícita.
- Usuario normal sin UPDATE/DELETE sobre evidencia contractual.
- Documentos finales inmutables; las correcciones crean versiones.
- Consentimientos revocados como nuevos eventos, no borrando el pasado.
- Restricciones únicas para prevenir aceptación repetida y eventos duplicados.
- Verificación de vínculo usuario-negocio desde sesión, no solo `tenant_id` del body.
- Protección CSRF/origen en operaciones autenticadas según estrategia de sesión.
- Rate limiting y controles de abuso en desafíos y endpoints públicos.
- URLs firmadas para archivos; no publicar contratos con identidad en buckets públicos.
- Registro mínimo de IP, sin confiar en cabeceras arbitrarias no verificadas.
- Separación entre evidencia protegida y datos operativos sujetos a borrado.
- Observabilidad sin datos personales completos en logs.

### 9.6 Corrección de billing

Separar estado del pago, estado de autorización y derecho de uso del plan.

Casos que deben resolverse:

- Evento de pago duplicado no extiende otra vez el periodo.
- Evento antiguo aprobado no revoca una cancelación posterior.
- Estado del proveedor verificado cuando la notificación es ambigua.
- Si falla cancelar autorización anterior, no crear otra sin una estrategia segura de reconciliación.
- La fecha del periodo deriva de hechos del proveedor/contrato, no del momento en que llega un reintento.
- Petición de cancelación tiene acuse local y estados pendientes explícitos.
- La renovación no se reactiva por un webhook tardío.
- Nueva suscripción tras cancelación requiere nueva autorización.
- Avisos de renovación se programan con calendario real, no cada 30 días fijos.
- Se comprueba entrega o fallo del aviso y se contempla canal alternativo.

## 10. Plan de implementación por fases

Estimaciones orientativas para un desarrollador con conocimiento del proyecto. No incluyen tiempo de revisión jurídica, contratación de proveedores ni hallazgos de infraestructura.

| Fase | Entregables | Criterio de salida | Esfuerzo orientativo |
|---|---|---|---|
| 0. Decisiones e inventario | Parte contratante, roles de datos, planes reales, proveedores, backups, riesgos financieros | Inventario completo y decisiones críticas resueltas | 2–4 días |
| 1. Documentos | Contrato, ficha, DPA, privacidad, salida y operación revisados | No contienen promesas inexistentes ni campos pendientes | 2–4 días técnicos más revisión jurídica |
| 2. Evidencia y activación | Versiones, oferta, verificación, aceptación, comprobante, controles de escritura | API rechaza acciones no autorizadas; pruebas de atribución e integridad | 5–8 días |
| 3. Compradores y recurrentes | Avisos por negocio, condiciones de compra, mandatos y renovación | El dueño no firma por el comprador; cobros autorizados y cancelables | 4–7 días |
| 4. Exportación y cierre | Paquete integral, ARCO, cierre, retención, borrado y acuses | Exportación completa y eliminación verificadas en entorno de prueba | 5–9 días |
| 5. Continuidad y despliegue | Ensayo de restauración, integración PSC, monitoreo y migración | Evidencia real de recuperación y conservación; rollout seguro | 3–6 días más proveedores |

Las fases pueden solaparse parcialmente. No activar reglas de aceptación con documentos todavía no aprobados. No activar trabajos destructivos hasta probar exportación, retención y restauración.

### Migración de usuarios existentes

1. Publicar la nueva documentación y explicar cambios materiales.
2. Mantener histórico anterior y su fecha, sin fabricar aceptaciones.
3. Mostrar estado “pendiente de nueva aceptación” únicamente a quien tenga facultades.
4. Permitir consulta, exportación, cancelación y privacidad durante la transición.
5. Comunicar fecha efectiva compatible con contratos anteriores; los términos actuales prometen 15 días para cambios relevantes.
6. Pedir nueva aceptación cuando corresponda por alcance material.
7. Registrar rechazos y permitir salida razonable.
8. No transformar el `created_at` del usuario en `accepted_at`.
9. No asumir consentimiento de marketing por haber usado Tlaco.
10. Aplicar por cohortes y monitorear fallos del flujo; rollback sin borrar evidencia.

## 11. Pruebas de aceptación mínimas

### Contratos e identidad

1. Un usuario sin contrato requerido no publica ni registra clientes reales por API directa.
2. El dueño acepta y el empleado autorizado puede operar sin suplantar representación.
3. Un miembro sin facultades no obliga al negocio.
4. La versión publicada después no altera documentos previamente aceptados.
5. El usuario ve el mismo hash/documentos que el servidor registra.
6. Un doble clic produce un expediente y una operación.
7. Si la oferta expira, se conserva el borrador.
8. Un correo marcado administrativamente no satisface control de contacto.
9. No se almacenan OTP, contraseñas o tokens en evidencia.
10. Cambiar alias no modifica la identidad histórica del contrato.
11. Una organización con varios negocios muestra exactamente los cubiertos.
12. Un usuario existente conserva derechos de salida aunque no acepte cambios.

### Privacidad y compradores

13. Rechazar publicidad permite comprar y usar el servicio.
14. El aviso del negocio corresponde al tenant de la orden.
15. Un pedido en efectivo no exige mandato de cargo recurrente.
16. `identity_consent_at` no se inventa al identificar al cliente.
17. Una huella o teléfono coincidente no da acceso automático a historial privado.
18. Las peticiones ARCO tienen responsable y fechas en días hábiles.
19. Un comprador recibe sus datos y no la base completa del negocio.
20. Un empleado que sale no elimina otros usuarios o negocios.

### Cobros

21. Cancelar detiene la autorización cuando procede y conserva acuse.
22. Un timeout no se presenta como cancelación confirmada.
23. Pago duplicado no altera periodo ni estado dos veces.
24. Webhook tardío no revierte cancelación.
25. Fallo al cancelar el plan anterior no deja dos mandatos inadvertidos.
26. Aviso de renovación se calcula sobre la fecha real.
27. Cambio de monto no reutiliza una autorización insuficiente.
28. Reactivación requiere una acción y autorización válidas.

### Exportación, borrado y continuidad

29. Export con más filas que el límite de consulta conserva todas.
30. Aislamiento entre negocios en tablas y archivos.
31. CSV no permite fórmulas peligrosas al abrirlo en hoja de cálculo.
32. El ZIP tiene manifiesto, conteos y archivos esperados.
33. Export fallida detiene borrado automático y genera atención.
34. Legal hold conserva solo categorías justificadas.
35. El cierre expira enlaces, sesiones y dispositivos según alcance.
36. Restaurar backup no revive datos suprimidos ni mandatos revocados.
37. Se recuperan tanto base como objetos Storage.
38. La caída del correo o PSC genera reintento sin duplicar aceptación.
39. Se valida el expediente y su constancia con un procedimiento documentado.
40. Los documentos legales siguen consultables aunque el panel esté limitado.

Verificación de implementación cuando se programe: pruebas unitarias de reglas puras, integración de RLS/transacciones, flujos de UI críticos y los comandos existentes `npm run test`, `npm run test:integration` y `npm run verify`, con configuración de entorno de pruebas. Este informe no ejecutó esas pruebas ni implementó los cambios.

## 12. Aspectos adicionales que no deben quedar fuera

- **Cadena de derechos:** contratos con desarrolladores, aportaciones laborales, recursos gráficos, licencias de paquetes y plantillas.
- **Marca:** dominio, razón social, marca y registro de software son cuestiones diferentes; revisar estrategia de registro.
- **Dinero real:** documentar si Tlaco solo integra cobros o recibe y distribuye dinero. El texto del contrato no transforma el flujo financiero.
- **Intermediación fiscal:** evaluar con contador el alcance de IVA y del artículo 30-B del CFF vigente en 2026 si Tlaco entra en los supuestos de servicios digitales a los que remite. No todo SaaS entra por ser una web; tampoco basta autodenominarse intermediario técnico para excluir obligaciones. [F12]
- **Crédito y préstamos:** existen módulos relacionados; confirmar quién presta, fija condiciones, cobra y asume riesgo. Si Tlaco cambia de rol, requiere análisis regulatorio específico.
- **Datos de crédito:** revisar retención y usos; no convertir el SaaS en un buró informal.
- **Verticales sensibles:** salud, menores u otros datos especiales requieren evaluación propia; no habilitar almacenamiento indiscriminado en notas libres.
- **Subproveedores:** inventariar entidad contractual, servicio, categorías, países/regiones, subcontratación y condiciones de salida.
- **Inteligencia artificial futura:** para Tlaco Studio, definir imágenes enviadas, finalidad, proveedor, derechos sobre contenido y si existe uso para entrenamiento; no reutilizar datos de compradores por defecto.
- **Seguridad interna:** MFA para administración, mínimo privilegio, bajas de colaboradores, gestión de secretos, auditoría y simulacros.
- **Publicidad:** no anunciar “100 % seguro”, “nunca pierdes datos” o “sin interrupciones” si no puede sostenerse.
- **Contracargos y devoluciones:** separar precio SaaS de ventas de comerciantes y responsabilidades por cada flujo.
- **Cierre de Tlaco:** definir cómo se avisaría una discontinuación general y cómo se recuperaría información; no prometer operación eterna.
- **Seguro y estructura societaria:** evaluar con profesionales si el volumen y exposición justifican seguro tecnológico/cibernético y operar mediante sociedad. Ninguno sustituye controles ni extingue toda responsabilidad personal.

## 13. Decisiones necesarias antes de publicar

| Decisión | Responsable recomendado | Resultado |
|---|---|---|
| Persona física o sociedad que presta Tlaco | Saúl + jurídico/contador | Identidad contractual y facturación |
| Tipo de clientes y aplicación LFPC | Jurídico | Condiciones apropiadas por relación |
| Límite de responsabilidad | Jurídico + negocio | Monto, alcance y excepciones defendibles |
| Propiedad de desarrollos y colaboradores | Jurídico + Saúl | Evidencia de titularidad |
| Qué se promete en planes Gratis y pagados | Producto + ingeniería | Fichas verificables |
| RPO, RTO y disponibilidad | Ingeniería | Resultados medidos antes de prometer |
| Regiones y proveedores | Ingeniería + privacidad | Inventario y anexos |
| Plazos por categoría | Jurídico + contador + ingeniería | Matriz de retención ejecutable |
| Exportación y cierre | Producto + ingeniería | Formatos, fechas y canales |
| PSC y firmas | Jurídico + ingeniería | Flujo, costo y validación |
| Privacidad de cada negocio | Comerciante + Tlaco como facilitador | Aviso propio y datos correctos |
| Flujo real de fondos y crédito | Jurídico especializado + operación | Roles y obligaciones según hechos |

## 14. Fuentes oficiales y técnicas

Consultadas el 24 de octubre de 2026. Las fuentes legislativas enlazadas deben revisarse nuevamente al aprobar y publicar documentos.

- **F1.** [Ley Federal del Derecho de Autor](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFDA.pdf), artículos 5, 30 y 101–106; consolidado consultado con reforma de 14-05-2026.
- **F2.** [Código Civil Federal, Orden Jurídico Nacional](https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo17186.html), artículos 2104–2117. Esta copia corresponde a enero de 2024; se contrastó la [reforma de noviembre de 2025](https://www.dof.gob.mx/nota_detalle.php?codigo=5773097&fecha=14/11/2025), cuyos cambios al CCF no modifican los artículos sustantivos aquí utilizados. El PDF actualizado de Diputados no pudo recuperarse mediante la herramienta.
- **F3.** [Ley Federal de Protección al Consumidor](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf), artículos 1–2, 76 Bis, 85–90; reforma consultada de 12-12-2025.
- **F4.** [Ley Federal de Protección de Datos Personales en Posesión de los Particulares](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf), nueva ley de 20-03-2025, reforma consultada de 14-11-2025.
- **F5.** [Reglamento LFPDPPP](https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LFPDPPP.pdf), especialmente artículos 49–54 y 63–66; interpretar en compatibilidad con el marco vigente.
- **F6.** [Código de Comercio](https://www.diputados.gob.mx/LeyesBiblio/pdf/CCom.pdf), artículos 49, 80, 89–93 y 97; el documento distingue reforma de 14-11-2025 y actualización de cantidades de 18-02-2026.
- **F7.** [NOM-151-SCFI-2016, texto DOF](https://dof.gob.mx/normasOficiales/6499/seeco11_C/seeco11_C.html).
- **F8.** [GitHub: Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
- **F9.** [Supabase: Database Backups](https://supabase.com/docs/guides/platform/backups).
- **F10.** [Profeco: suscripciones digitales, 17-03-2026](https://www.gob.mx/profeco/prensa/que-las-suscripciones-digitales-no-afecten-tu-presupuesto-profeco-te-orienta?idiom=es-MX).
- **F11.** [Profeco: contratos de adhesión](https://www.gob.mx/profeco/documentos/contratos-de-adhesion-informate-antes-de-firmar?state=published).
- **F12.** [Código Fiscal de la Federación](https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf), artículo 30; consolidado consultado con reforma de 09-04-2026.

El siguiente trabajo de desarrollo debe comenzar por cerrar las decisiones de la sección 13 y convertir las fases en cambios pequeños revisables. La aceptación contractual debe reflejar lo que el sistema realmente puede cumplir.

