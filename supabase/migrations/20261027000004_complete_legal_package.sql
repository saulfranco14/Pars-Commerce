-- Paquete contractual integral. Las versiones breves anteriores se conservan
-- como historial inmutable, pero la oferta vigente toma estas versiones por
-- ser las publicaciones más recientes de cada tipo.

ALTER TABLE public.legal_document_versions
  DROP CONSTRAINT IF EXISTS legal_document_versions_document_type_check;

ALTER TABLE public.legal_document_versions
  ADD CONSTRAINT legal_document_versions_document_type_check
  CHECK (document_type IN (
    'saas_terms',
    'privacy_notice',
    'data_processing',
    'service_policy',
    'exit_policy',
    'merchant_terms',
    'merchant_privacy'
  ));

WITH documents(document_type, title, content) AS (
  VALUES
  (
    'saas_terms'::text,
    'Contrato de servicios SaaS y licencia de uso de Tlaco'::text,
    $doc$
CONTRATO DE SERVICIOS SAAS Y LICENCIA DE USO DE TLACO

1. PARTES E INCORPORACIÓN DE DOCUMENTOS
Este contrato se celebra entre Saúl Mauricio Franco Rentería, quien opera la plataforma bajo la marca Tlaco, con domicilio en Unión 19, Xochitenco, Chimalhuacán, Estado de México, en adelante “Tlaco” o el “Prestador”, y la persona física o moral identificada en la ficha de apertura y en el comprobante de aceptación, en adelante el “Contratante”. La persona que acepta declara que cuenta con capacidad y, cuando actúe por una persona moral o negocio ajeno, con facultades suficientes para obligarlo.

Forman parte del contrato: la ficha de apertura y aceptación; la descripción y precio del plan mostrado al contratar; el Anexo de tratamiento de datos; la Política operativa del servicio; la Política de salida y recuperación de datos; y el Aviso de privacidad de Tlaco. El comprobante identifica las versiones y hashes exactos aceptados. Si existe contradicción, prevalecerán la ficha económica para precio y plan, el Anexo de tratamiento para datos tratados por cuenta del negocio y este contrato para las demás materias.

2. OBJETO Y ALCANCE DEL SERVICIO
Tlaco concede acceso remoto a una plataforma para apoyar la operación del negocio, incluyendo, según el plan y módulos habilitados, catálogo de productos o servicios, tienda pública, órdenes, tickets, agenda, mesas y códigos QR, registros de cobro, suscripciones, promociones, reportes y herramientas de administración. Las funciones concretas disponibles son las que la interfaz y la ficha del plan muestren al momento de contratar.

Tlaco es una herramienta tecnológica. Salvo indicación expresa en una oferta separada, no vende los productos del Contratante, no es acreedor de sus clientes, no otorga créditos, no garantiza el pago de operaciones y no sustituye las obligaciones fiscales, comerciales, laborales, sanitarias o de protección al consumidor del Contratante. Los proveedores de pago procesan las transacciones conforme a sus propios términos.

3. LICENCIA Y USUARIOS AUTORIZADOS
Durante la vigencia, Tlaco concede al Contratante una licencia limitada, no exclusiva, no transferible y revocable por las causas previstas en este contrato para usar la plataforma en sus negocios autorizados. No comprende venta del software, cesión de derechos patrimoniales, acceso a código fuente ni derecho para copiar, descompilar, explotar o crear servicios competidores a partir de componentes protegidos, salvo lo permitido expresamente por la ley.

El propietario puede invitar colaboradores y asignarles permisos. El Contratante responde por administrar altas, bajas y privilegios, mantener credenciales confidenciales y avisar sin demora accesos no autorizados. Un colaborador no puede aceptar nuevas versiones contractuales ni cerrar el negocio salvo que tenga facultades y el sistema lo reconozca como propietario autorizado.

4. ALTA, IDENTIDAD Y VERACIDAD
El Contratante proporcionará información completa y actualizada sobre su identidad, representación, negocio y contacto. Tlaco podrá solicitar comprobaciones proporcionales al riesgo antes de pagos, exportaciones, cambios de propietario o cierre. La creación administrativa de una cuenta o la marca técnica de correo confirmado no equivale por sí sola a una verificación jurídica de identidad.

5. CONTENIDO Y DATOS DEL NEGOCIO
El Contratante conserva los derechos que legalmente le correspondan sobre textos, fotografías, catálogos, marcas y demás materiales que incorpore. Autoriza a Tlaco a alojarlos, transformarlos técnicamente, respaldarlos y publicarlos únicamente para prestar las funciones elegidas. Esta autorización no permite venderlos ni utilizarlos para publicidad ajena al servicio.

El Contratante garantiza que cuenta con derechos para usar sus materiales y que su catálogo y actividad son lícitos. También es responsable de informar a sus clientes sobre el tratamiento de datos que realiza como responsable, definir condiciones de venta, atender devoluciones y cumplir obligaciones aplicables. Los datos personales se rigen además por el Anexo de tratamiento y los avisos correspondientes.

6. PLANES, PRECIOS, IMPUESTOS Y COBROS RECURRENTES
El plan, precio, moneda, impuestos, periodo y fecha de inicio aplicables son los mostrados antes de contratar y reflejados en la operación de facturación. El plan Gratis no genera por sí mismo un cargo automático. Cualquier plan recurrente requiere autorización separada que muestre importe, frecuencia, inicio y medio de cancelación.

Los cargos de redes de pago, bancos o terceros se informarán cuando formen parte del flujo y pueden estar sujetos a condiciones de esos proveedores. El Contratante es responsable de sus obligaciones fiscales y de proporcionar datos de facturación correctos. Un cambio de precio o frecuencia que legalmente requiera nueva autorización no se cargará apoyándose únicamente en una aceptación general anterior.

7. OBLIGACIONES DE USO
El Contratante no utilizará Tlaco para actividades ilícitas, fraude, suplantación, lavado de dinero, vulneración de derechos, distribución de malware, extracción masiva no autorizada, acceso a otros negocios ni almacenamiento deliberado de datos sensibles innecesarios. Tampoco intentará eludir límites técnicos o degradar el servicio.

Tlaco podrá limitar una función cuando exista riesgo razonable para seguridad, terceros o continuidad. Salvo urgencia, obligación legal o fraude, comunicará la causa y permitirá subsanar. La suspensión será proporcional y no impedirá el acceso a documentos contractuales, solicitudes de privacidad, cancelación o exportación cuando legal y técnicamente corresponda.

8. OPERACIÓN, SOPORTE Y TERCEROS
La disponibilidad, mantenimiento, soporte, respaldos y manejo de incidentes se describen en la Política operativa vigente incorporada al contrato. No se promete disponibilidad absoluta, recuperación instantánea ni ausencia total de errores. Tlaco utilizará medidas razonables y comunicará interrupciones relevantes conocidas.

El servicio depende de infraestructura, correo, almacenamiento y proveedores de pago. Tlaco sigue siendo responsable de sus propias obligaciones y administrará esas dependencias conforme al contrato; la participación de terceros no convierte automáticamente toda falla en fuerza mayor.

9. PROPIEDAD INTELECTUAL
Tlaco, su software, diseño, documentación, marca y mejoras permanecen con sus titulares. Los componentes de terceros se rigen por sus licencias. Sugerencias generales pueden utilizarse para mejorar el producto sin revelar información confidencial. Cualquier desarrollo exclusivo, entrega de código, cesión o titularidad especial requiere convenio escrito separado.

10. CONFIDENCIALIDAD Y SEGURIDAD
Cada parte protegerá la información no pública recibida y la usará sólo para ejecutar la relación. Tlaco mantiene separación lógica por negocio, controles de acceso, comunicaciones cifradas en tránsito y medidas administrativas razonables. El Contratante limitará permisos y dispositivos. Las obligaciones específicas sobre datos personales e incidentes se encuentran en el Anexo de tratamiento.

11. VIGENCIA, CANCELACIÓN Y TERMINACIÓN
El contrato inicia con la aceptación y continúa mientras exista un negocio o servicio activo. Cancelar una membresía detiene renovaciones conforme a la oferta, pero no equivale a cerrar el negocio ni a borrar datos. El cierre se tramita conforme a la Política de salida.

Cualquiera de las partes puede terminar por incumplimiento material no subsanado tras aviso razonable, salvo casos graves que justifiquen acción inmediata. Tlaco podrá terminar por requerimiento legal, fraude acreditado, riesgo de seguridad o uso prohibido. Los pagos devengados, la propiedad intelectual, confidencialidad, evidencia, retenciones justificadas y solución de controversias subsisten según corresponda.

12. RESPONSABILIDAD
Cada parte responde por los daños directos que le sean imputables conforme a la legislación aplicable. Ninguna disposición excluye dolo, responsabilidades que legalmente no puedan limitarse, derechos irrenunciables ni obligaciones expresas de devolución o reparación. Tlaco no responde por decisiones comerciales del Contratante, contenido ilícito que éste cargue, datos bancarios incorrectos ni actos de usuarios a quienes el Contratante otorgó permisos, sin perjuicio de las obligaciones propias de Tlaco.

No se establece en esta versión un límite económico universal que pueda dejar sin remedio a un plan gratuito o resultar abusivo. Cualquier límite específico deberá aparecer en la ficha del plan, ser jurídicamente procedente y no reducir derechos obligatorios.

13. CAMBIOS AL CONTRATO
Los cambios materiales se publicarán como nueva versión y se comunicarán con anticipación razonable; cuando alteren sustancialmente obligaciones, precio o tratamiento, se solicitará nueva aceptación. Las versiones anteriores y su evidencia no se reescriben. El Contratante puede rechazar una nueva versión y usar los mecanismos de cancelación y salida disponibles conforme al periodo de transición comunicado.

14. CONTRATACIÓN ELECTRÓNICA Y EVIDENCIA
Las partes aceptan el uso de mensajes de datos. Tlaco registra usuario, negocio, documentos, versiones, hashes, texto de aceptación y fecha del servidor. El comprobante permite consulta posterior. Este mecanismo no se presenta como firma electrónica avanzada, certificación de un prestador de servicios de certificación ni constancia NOM-151 mientras esas integraciones no existan.

15. NOTIFICACIONES, LEY Y CONTACTO
Las comunicaciones operativas se realizarán dentro de la plataforma o mediante los contactos registrados. Para soporte y asuntos contractuales: tlaco.commerce@gmail.com. Este contrato se rige por las leyes de los Estados Unidos Mexicanos. La autoridad y competencia se determinarán conforme a la legislación aplicable, sin renuncia a derechos irrenunciables ni imposición de un fuero prohibido.
$doc$::text
  ),
  (
    'privacy_notice'::text,
    'Aviso integral de privacidad de Tlaco'::text,
    $doc$
AVISO INTEGRAL DE PRIVACIDAD DE TLACO

1. RESPONSABLE Y CONTACTO
Saúl Mauricio Franco Rentería, operando bajo la marca Tlaco, con domicilio en Unión 19, Xochitenco, Chimalhuacán, Estado de México, es responsable del tratamiento de los datos personales que recaba para administrar cuentas, contratación, soporte, seguridad y facturación. Contacto de privacidad: tlaco.commerce@gmail.com.

Este aviso cubre datos tratados para fines propios de Tlaco. Cuando un negocio usa la plataforma para registrar información de sus clientes, ese negocio determina las finalidades y actúa como responsable; Tlaco actúa como encargado conforme al Anexo de tratamiento.

2. DATOS QUE PODEMOS TRATAR
Datos de identificación y contacto: nombre, correo, teléfono, identificadores de cuenta y, cuando corresponda, datos del representante. Datos del negocio y contratación: nombre comercial, nombre legal, RFC si se proporciona, domicilio, plan, aceptación y comprobantes. Datos operativos: catálogo, configuración, órdenes y soporte. Datos técnicos y de seguridad: IP, dispositivo, sesión, fecha, eventos y registros necesarios para prevención de abuso. Datos financieros limitados: referencias de pago, estado e identificadores del proveedor; Tlaco no debe almacenar número completo de tarjeta, CVV ni contraseña bancaria.

No se solicitan datos personales sensibles para el alta ordinaria. El usuario debe evitar capturarlos en campos libres salvo que una función expresamente autorizada lo requiera y exista una base adecuada.

3. FINALIDADES NECESARIAS
Crear y administrar la cuenta; identificar al contratante y sus permisos; operar las funciones elegidas; procesar y conciliar referencias de pago; atender soporte; emitir comprobantes; prevenir fraude y accesos indebidos; conservar evidencia contractual; gestionar exportación, cierre y solicitudes de privacidad; cumplir obligaciones legales y defender derechos.

4. FINALIDADES OPCIONALES
Con autorización separada, Tlaco puede enviar novedades, encuestas y promociones propias. Negarse o revocar esta finalidad no limita el servicio. Las preferencias se administran desde el medio señalado en el mensaje o escribiendo al contacto de privacidad.

5. TECNOLOGÍAS DE SEGUIMIENTO
Tlaco usa cookies o almacenamiento local necesarios para sesión, seguridad, preferencias y continuidad del recorrido. También puede conservar atribución de campaña por tiempo limitado para medir adquisición. Si se incorporan tecnologías publicitarias o finalidades distintas, se informarán y habilitarán controles correspondientes.

6. ENCARGADOS, TRANSFERENCIAS Y TERCEROS
Proveedores de infraestructura, almacenamiento, correo, monitoreo y pagos pueden tratar datos por cuenta de Tlaco bajo instrucciones y medidas contractuales. Los proveedores de pago también pueden actuar como responsables independientes respecto de sus obligaciones. Tlaco podrá comunicar datos a autoridades mediante requerimiento fundado o en otros supuestos permitidos por ley. No vende bases de datos personales.

Cuando una transferencia requiera consentimiento, se solicitará de manera específica. El inventario operativo de proveedores, ubicación y alcance debe mantenerse actualizado internamente y reflejarse en el Anexo cuando actúen como subencargados.

7. DERECHOS ARCO Y REVOCACIÓN
La persona titular puede solicitar acceso, rectificación, cancelación u oposición, y revocar consentimiento cuando proceda, escribiendo a tlaco.commerce@gmail.com. La solicitud debe indicar nombre, medio para recibir respuesta, descripción clara del derecho y datos involucrados, y elementos razonables para acreditar identidad o representación. No deben enviarse contraseñas, OTP ni archivos de firma privada.

Tlaco comunicará la determinación dentro de veinte días hábiles y, si resulta procedente, la hará efectiva dentro de los quince días hábiles siguientes, sujeto a las ampliaciones justificadas permitidas por la ley. La cancelación puede incluir bloqueo previo y conservación restringida cuando exista obligación o defensa de derechos.

8. LIMITACIÓN DE USO Y DIVULGACIÓN
La persona puede oponerse a comunicaciones promocionales mediante el control incluido en el mensaje o el correo de privacidad. Tlaco registrará la exclusión mínima necesaria para respetar la preferencia. Las comunicaciones indispensables sobre seguridad, contrato, pagos o servicio no se consideran publicidad.

9. CONSERVACIÓN
Los datos operativos se conservan mientras sean necesarios para prestar el servicio y durante el proceso de salida. Evidencia contractual, documentación fiscal, disputas y seguridad se conservan por categorías y plazos justificados, con acceso restringido. No se aplica un plazo único de diez años a toda actividad. Exportaciones temporales y enlaces firmados caducan en plazos más breves.

10. SEGURIDAD E INCIDENTES
Tlaco aplica controles de acceso, separación por negocio, cifrado en tránsito, almacenamiento privado para evidencia y medidas de respaldo y registro. Ningún sistema es infalible. Cuando una vulneración afecte significativamente derechos patrimoniales o morales, Tlaco notificará sin demora a las personas o responsables correspondientes con la información disponible y medidas recomendadas.

11. DATOS DE CLIENTES DEL NEGOCIO
El negocio debe poner a disposición su propio aviso, definir finalidades y atender derechos de sus clientes. Tlaco procesa esos datos sólo para prestar las funciones solicitadas, no para publicidad propia. Las condiciones detalladas están en el Anexo de tratamiento.

12. CAMBIOS Y AUTORIDAD
Los cambios se publicarán como nueva versión. Si son materiales, se comunicarán antes de su vigencia y se solicitará aceptación cuando legalmente corresponda. La persona puede acudir a la autoridad federal competente en materia de protección de datos personales en posesión de particulares conforme al marco vigente. Tlaco no utiliza referencias institucionales desactualizadas como sustituto del derecho de la persona.
$doc$::text
  ),
  (
    'data_processing'::text,
    'Anexo de tratamiento de datos personales'::text,
    $doc$
ANEXO DE TRATAMIENTO DE DATOS PERSONALES

1. ROLES Y OBJETO
Respecto de los datos de clientes, empleados y contactos que el Contratante incorpore para operar su negocio, el Contratante actúa como responsable y Tlaco como encargado. Este Anexo documenta las instrucciones generales para alojar, organizar, consultar, respaldar, transmitir y suprimir esos datos únicamente con el fin de prestar las funcionalidades contratadas.

2. DURACIÓN E INSTRUCCIONES
El tratamiento dura mientras el negocio mantenga funciones activas y durante la salida controlada. Las instrucciones son las configuraciones y acciones autorizadas en Tlaco, este contrato y solicitudes documentadas compatibles con el servicio. Si Tlaco considera que una instrucción infringe la normativa, lo comunicará y podrá suspender su ejecución mientras se aclara.

3. PERSONAS Y CATEGORÍAS
Titulares posibles: clientes y prospectos del negocio, destinatarios de pedidos, contactos de proveedores y colaboradores. Datos posibles: nombre o alias, teléfono, correo, domicilio de entrega, instrucciones, historial de pedidos, pagos y adeudos registrados, citas, suscripciones, preferencias operativas y comunicaciones. No se autoriza cargar contraseñas, datos completos de tarjeta, expedientes clínicos, biométricos ni otros datos sensibles fuera de una función expresamente diseñada y revisada.

4. FINALIDADES
Gestionar catálogo, pedidos, entrega o recolección, comunicación transaccional, cobros y referencias, tickets, agenda, relaciones con clientes, reportes y soporte. Tlaco no determinará finalidades publicitarias propias sobre estas personas, no venderá la información y no mezclará bases de negocios para dar acceso cruzado.

5. OBLIGACIONES DEL CONTRATANTE
El Contratante informará a titulares, contará con base legal, capturará sólo datos necesarios, mantendrá información correcta, definirá periodos y configurará permisos. Atenderá solicitudes de titulares y dará a Tlaco instrucciones claras. No utilizará Tlaco para listas adquiridas ilícitamente, hostigamiento, discriminación ni datos excesivos.

6. OBLIGACIONES DE TLACO
Tlaco tratará datos sólo conforme a instrucciones; mantendrá confidencialidad; limitará accesos; separará negocios; asistirá razonablemente ante solicitudes, incidentes y evaluaciones; devolverá o suprimirá datos conforme a la Política de salida; e informará si no puede cumplir una instrucción. El personal y proveedores con acceso estarán sujetos a obligaciones de confidencialidad y mínimo privilegio.

7. MEDIDAS DE SEGURIDAD
Controles previstos: autenticación y autorización por negocio, RLS o controles equivalentes, cifrado en tránsito, secretos fuera del cliente, almacenamiento privado para documentos, URLs firmadas temporales, registros de eventos relevantes, gestión de bajas, dependencias actualizadas y respaldos conforme a la Política operativa. Las medidas se revisan según riesgo y evolución del servicio.

8. SUBENCARGADOS
Tlaco puede utilizar proveedores de nube, base de datos, almacenamiento, correo, monitoreo y procesamiento de pagos. Mantendrá un inventario de entidad, servicio, categorías, región y condiciones de salida. Exigirá obligaciones compatibles y seguirá siendo responsable de seleccionar y administrar subencargados conforme a la ley y el contrato. Cambios materiales se comunicarán cuando afecten el tratamiento.

9. SOLICITUDES DE TITULARES
El Contratante es el primer punto de contacto para sus clientes. Tlaco no responderá en nombre del Contratante salvo instrucción o deber legal. Proporcionará búsqueda, corrección, exportación o eliminación técnicamente disponibles y conservará únicamente excepciones justificadas. Una solicitud individual nunca habilita entregar la base completa del negocio.

10. INCIDENTES
Tlaco registrará, contendrá y evaluará incidentes. Informará al Contratante sin demora indebida cuando conozca una vulneración relevante de datos tratados por su cuenta, indicando alcance conocido, categorías, medidas y recomendaciones. El Contratante decide y realiza comunicaciones que le correspondan, con asistencia razonable de Tlaco. No se promete automáticamente un plazo europeo de setenta y dos horas como regla mexicana general.

11. AUDITORÍA Y EVIDENCIA
Tlaco facilitará información razonable sobre controles y cumplimiento sin revelar secretos, datos de otros clientes ni debilitar seguridad. Auditorías extraordinarias requieren alcance, confidencialidad y costos razonables. La evidencia de aceptación, versiones y hashes se conserva separadamente de datos operativos.

12. DEVOLUCIÓN, SUPRESIÓN Y RESPALDOS
Al cierre, Tlaco ofrecerá exportación en formatos documentados, restringirá operación y suprimirá datos elegibles conforme a la Política de salida. Las copias de respaldo expirarán según su ciclo; no se usarán ordinariamente y una restauración deberá reaplicar registros de supresión y cancelaciones. Las retenciones legales se aislarán y limitarán.

13. PRELACIÓN Y RESPONSABILIDAD
Este Anexo prevalece para tratamiento por cuenta del Contratante. No transfiere a Tlaco las obligaciones propias del responsable ni permite al Contratante instruir actividades ilícitas. Cada parte responde por sus propias obligaciones conforme a la legislación aplicable.
$doc$::text
  ),
  (
    'service_policy'::text,
    'Anexo operativo y política de servicio'::text,
    $doc$
ANEXO OPERATIVO Y POLÍTICA DE SERVICIO

1. ALCANCE
Este Anexo describe la operación de Tlaco para panel, catálogo público, pedidos y funciones habilitadas. No todas las funciones dependen de los mismos proveedores ni comparten idéntico estado. La disponibilidad se evalúa por capacidad de ejecutar una función relevante, no únicamente por recibir una respuesta HTTP.

2. DISPONIBILIDAD
Tlaco trabaja para mantener continuidad razonable, pero esta versión no promete un porcentaje contractual, RPO o RTO numérico mientras no exista medición y ensayo de restauración que los sostenga. Una oferta futura podrá incorporar métricas específicas sin modificar retrospectivamente este Anexo. No se garantiza operación ininterrumpida, ausencia de errores ni recuperación instantánea.

3. MANTENIMIENTO
El mantenimiento programado se comunicará con anticipación razonable cuando pueda afectar operaciones. El mantenimiento urgente de seguridad puede ejecutarse sin aviso previo. Tlaco procurará reducir duración e impacto y actualizará el estado disponible por los canales de soporte.

4. SOPORTE
Las solicitudes se reciben en tlaco.commerce@gmail.com y los canales mostrados en la plataforma. Se clasifican por impacto: crítico cuando impide operaciones principales de múltiples negocios o compromete seguridad; alto cuando bloquea una función principal; normal para errores con alternativa o consultas. Los tiempos comunicados son objetivos operativos, no garantía automática de resolución, salvo ficha de plan aprobada.

5. RESPALDOS Y RECUPERACIÓN
La estrategia debe cubrir base de datos, objetos de Storage, configuración recuperable, identidad, evidencia contractual y registros necesarios para reconciliar pagos. Un respaldo de base no implica respaldo de archivos. Tlaco realizará verificaciones y ensayos conforme a su capacidad contratada; antes de reactivar tráfico después de una restauración conciliará permisos, supresiones y estados de cobro para evitar revivir usuarios o mandatos cancelados.

6. INCIDENTES
El proceso comprende detección, contención, preservación de evidencia, evaluación de negocios y titulares, recuperación aislada, conciliación y acciones correctivas. Tlaco comunicará información relevante conocida y evitará afirmaciones absolutas antes de determinar alcance.

7. EXCLUSIONES
No se contabilizan como incumplimiento atribuible a Tlaco: acciones del Contratante, credenciales comprometidas por éste, equipos o conectividad del usuario, suspensión solicitada, mantenimiento comunicado o eventos externos inevitables después de medidas razonables. Una dependencia de terceros no se considera automáticamente caso fortuito y se analizará según hechos y ley.

8. CAMBIOS Y REMEDIOS
Los compromisos medibles de un plan se mostrarán en su ficha. Cualquier crédito o remedio se aplicará conforme a esa oferta y la ley, sin sustituir derechos irrenunciables. Los cambios materiales de este Anexo crean una nueva versión y pueden requerir nueva aceptación.
$doc$::text
  ),
  (
    'exit_policy'::text,
    'Política de cancelación, exportación y salida de datos'::text,
    $doc$
POLÍTICA DE CANCELACIÓN, EXPORTACIÓN Y SALIDA DE DATOS

1. SOLICITUDES DISTINTAS
Cancelar una membresía detiene renovaciones y puede conservar el negocio en el plan Gratis. Cerrar un negocio detiene su operación pública y activa la salida. Eliminar una cuenta personal o ejercer derechos ARCO se evalúa por persona, negocios asociados, facultades y retenciones. Una acción no produce automáticamente las otras.

2. QUIÉN PUEDE SOLICITAR
El propietario autorizado puede exportar o cerrar un negocio. Tlaco puede requerir reautenticación o verificación proporcional al riesgo. Un colaborador que elimina su perfil no elimina negocios ajenos. Cuando exista un único propietario, primero se resolverá transferencia o cierre informado.

3. EXPORTACIÓN
Antes o durante el cierre se puede solicitar un paquete ZIP privado. Según los módulos utilizados contendrá: business.json; products.csv; services.csv; customers.csv; orders.csv; order_items.csv; payments.csv; subscriptions.csv; credits.csv cuando aplique; archivos recuperables; schema.json; manifest.json con conteos y hashes; y README.txt con alcance y exclusiones.

La exportación usa paginación y aislamiento por negocio. No incluye contraseñas, tokens, datos completos de tarjeta, claves de pago, secretos internos ni datos de otros negocios. El enlace es firmado, temporal y auditable. Una exportación de todo el negocio es distinta de una solicitud individual ARCO.

4. INICIO DEL CIERRE
Tlaco registra folio, solicitante, alcance y fecha. Detiene nuevos pedidos cuando corresponda, mantiene atención de operaciones pendientes y explica consecuencias. La baja no se condiciona a descargar el archivo, pero se ofrece recuperación antes de eliminar datos elegibles.

5. VENTANA DE RECUPERACIÓN
La interfaz informará la ventana vigente antes de confirmar. Durante ella puede existir acceso restringido a consulta y exportación. Al finalizar se revocan accesos y enlaces, se despublica el negocio y se inicia supresión. Si la exportación falla, el borrado automático se detiene para resolver la incidencia; esto no autoriza retención indefinida.

6. SUPRESIÓN Y RETENCIÓN
Se suprimen catálogo, configuraciones, clientes y archivos operativos cuando dejan de ser necesarios y no existe excepción. Evidencia contractual, documentación fiscal, disputas, prevención de fraude y requerimientos de autoridad pueden conservarse de forma separada, restringida y por el plazo aplicable. No se conserva la base completa “por si acaso”. Cada retención debe identificar categoría, fundamento, responsable y revisión.

7. RESPALDOS
Los datos eliminados pueden permanecer temporalmente en respaldos aislados hasta su caducidad documentada. No se utilizarán para operación ordinaria. Si se restaura una copia, Tlaco reaplicará registros de supresión, revocación y cancelación antes de habilitar el servicio.

8. PAGOS Y SUSCRIPCIONES
El cierre no borra deudas, reembolsos, contracargos u obligaciones pendientes. Tlaco solicitará cancelar autorizaciones recurrentes que le correspondan y mostrará estado confirmado o pendiente; un timeout no se presenta como cancelación exitosa. Webhooks tardíos no deben reactivar una autorización revocada.

9. CIERRE Y COMPROBANTE
Al concluir, Tlaco emitirá estado de acciones ejecutadas, categorías eliminadas, retenciones justificadas y fechas pendientes. Los contratos, comprobantes y canales de privacidad continuarán accesibles por medios razonables aunque el panel operativo esté limitado.

10. CONTACTO Y CAMBIOS
Solicitudes y dudas: tlaco.commerce@gmail.com. Los cambios materiales a esta Política se publican como nueva versión y no alteran retrospectivamente cierres o evidencias anteriores.
$doc$::text
  )
)
INSERT INTO public.legal_document_versions (
  document_type,
  tenant_id,
  version,
  title,
  content,
  content_hash,
  status,
  effective_at,
  published_at
)
SELECT
  document_type,
  NULL,
  '2026-10-27.2',
  title,
  trim(content),
  encode(extensions.digest(trim(content)::text, 'sha256'::text), 'hex'),
  'published',
  now(),
  now()
FROM documents
ON CONFLICT DO NOTHING;
