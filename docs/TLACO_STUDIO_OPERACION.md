# Tlaco Studio: configuración, QA y operación

Complementa la [especificación principal](TLACO_STUDIO_IMPLEMENTACION_CODEX.md). Estado actual (8 de noviembre de 2026): migraciones aplicadas y probadas solo en Supabase local, tipos regenerados de ese esquema y pruebas automáticas ejecutadas (ver §7). Sin migraciones remotas, proveedores conectados ni QA manual. Esta guía no acredita esos pasos.

## 1. Entornos y secretos

Usar un proyecto Supabase aislado para migraciones, RLS, pagos sandbox y el piloto. Preservar la configuración operativa de los comerciantes. Plantilla sin secretos: [studio.env.example](studio.env.example).

| Configuración | Ubicación | Efecto |
| --- | --- | --- |
| STUDIO_ENABLED | Next | Autoriza escrituras; lectura y descargas permanecen disponibles. |
| NEXT_PUBLIC_STUDIO_BUSINESS_ENABLED | Next/cliente | Muestra el menú y accesos contextuales de Studio en todos los negocios. Mantener false durante instalación y piloto. |
| NEXT_PUBLIC_STUDIO_PILOT_TENANT_IDS | Next/cliente | UUID de los negocios piloto, separados por coma. Muestra Studio solo en sus menús mientras la visibilidad global siga apagada. |
| STUDIO_PUBLIC_ENABLED | Next | Landing, sitemap y enlaces públicos. Activar al final. |
| STUDIO_CHECKOUT_ENABLED | Next | Nuevas contrataciones, recargas y cambios de plan. |
| STUDIO_AI_ENABLED | Next y Edge | Solicitud y ejecución de IA. Debe coincidir en ambos. |
| STUDIO_PUBLISH_ENABLED | Next | Aplicación y resolución pública del arte. |
| STUDIO_BILLING_WEBHOOK_ENABLED | Next | Mantiene conciliación financiera al apagar creación. |
| TLACO_MP_ACCESS_TOKEN | Next | Cuenta receptora propia de Tlaco. |
| MERCADOPAGO_WEBHOOK_SECRET | Next | Verificación de notificaciones; obligatorio en producción. |
| STUDIO_WORKER_URL | Next | URL de la función del mismo proyecto Supabase. |
| STUDIO_WORKER_SECRET | Next, Edge, Vault | Autentica invocaciones de worker y diagnóstico. |
| STUDIO_CRON_SECRET | Next, Vault | Autentica conciliación HTTP. Distinto del secreto del worker. |
| Claves y modelos de proveedor | Next y Edge | La cotización considera las rutas realmente configuradas. |

Supabase proporciona SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY a la Edge Function. Las claves de Next y Service Role nunca llegan al navegador. No guardar valores en migraciones, snippets, capturas, fixtures ni logs. No es necesario configurar proveedores que se mantendrán deshabilitados.

Vault necesita `studio_worker_url`, `studio_worker_secret`, `studio_reconcile_url` y `studio_reconcile_secret`. Usar el panel/gestor del entorno para cargar sus valores. Los snippets no contienen secretos.

## 2. Orden de despliegue

1. Registrar rama/base, respaldos del entorno y migraciones ya aplicadas. Ejecutar `supabase/snippets/studio_prechecks.sql` contra el entorno aislado.
2. Aplicar las cuatro migraciones `2026110200000[1-4]` mediante el flujo habitual de migraciones de Supabase. No editar migraciones históricas ni hacer db reset en un proyecto con datos reales.
3. Confirmar bucket privado, catálogo y permisos con `studio_health.sql`.
4. Tipos: `src/types/database.types.ts` ya se regeneró del esquema local con las cuatro migraciones (`npx supabase gen types typescript --local --schema public`, formateado con `npx prettier@3.3.3 --no-semi --parser typescript`). `src/types/studio.database.ts` quedó como un puente mínimo: solo marca como anulables los argumentos que el SQL acepta en `NULL`. Si una migración nueva cambia el esquema, regenerar igual.
5. Desplegar Next con banderas desactivadas y verificar que los flujos previos sigan operando.
6. Desplegar la función: `supabase functions deploy studio-worker --project-ref PROJECT_REF`. Su configuración usa verify_jwt=false porque el handler valida un secreto específico de forma constante; no es una función abierta.
7. Cargar secretos coherentes en Next, Edge y Vault. Confirmar que la URL del worker corresponde al mismo proyecto, sin redirecciones ajenas.
8. Configurar Mercado Pago en la cuenta de Tlaco. Notificaciones: payment, subscription_preapproval y subscription_authorized_payment hacia `/api/mercadopago/webhook`. Verificar firma y consulta real del receptor.
9. Ejecutar benchmark y registrar costo máximo por intento. Solo entonces actualizar studio_ai_routes con modelo, estimación positiva, prioridad y ruta activa. Cambios en la ruta incrementan su versión; desactivar rutas no evaluadas.
10. Configurar studio_runtime_limits con presupuesto diario y mensual por tenant autorizados. Ambos empiezan en cero, por lo que el worker no debe considerarse listo hasta configurarlos.
11. Activar el despacho con `supabase/snippets/studio_cron_schedule.sql`: worker cada minuto y conciliación cada cinco. Las migraciones no programan tareas automáticamente.
12. Habilitar capacidades del piloto, completar QA, validar recuperación y pagos. Activar la landing y sitemap únicamente con el producto ofrecido disponible.
13. Configurar alertas del proveedor de observabilidad del entorno y revisar Search Console. No existe una conexión de alertas ni una alta en Search Console realizada por este cambio.

La cuota de dos jobs por tenant y un job por invocación es deliberadamente pequeña. Revisar memoria, duración y concurrencia reales de Edge antes de incrementar capacidad; una ejecución no depende de tiempo ilimitado.

### Alcance de la migración para negocios existentes

Las cuatro migraciones son aditivas en cuanto a datos comerciales: crean tablas Studio, índices, funciones/RPC, RLS, el bucket privado `studio-assets`, la cola `studio_ai` y las extensiones `pgmq`, `pg_cron` y `pg_net` si faltan. Cargan el catálogo inicial de Studio y rutas de IA deshabilitadas/presupuesto cero. **Sí actualizan `tenant_roles` de los negocios existentes**: cada rol de sistema `member` recibe `studio.read` y `studio.create`; `owner` ya pasa la comprobación de permisos. Un trigger aplica el mismo default a roles de sistema `member` creados después. Los roles personalizados y los productos, promociones, planes operativos, ventas y saldos previos no se reescriben. Ningún negocio recibe una suscripción Studio pagada ni Tlacos por migrar. La migración de operaciones crea la función de Cron pero no agenda tareas: el despacho se activa aparte con el snippet. La funcionalidad pública/privada sigue controlada por las banderas de Next.

Para decidir una aplicación remota, comprobar primero en el proyecto destino que están las migraciones comerciales requeridas, `pgmq` y Vault (`studio_prechecks.sql`), revisar respaldo y contar los roles `member` que cambiarán. Ejecutar las migraciones en un proyecto aislado antes del proyecto con negocios reales y revisar RLS, catálogo, bucket y `studio_health.sql`. Dejar `NEXT_PUBLIC_STUDIO_BUSINESS_ENABLED=false` durante la instalación para no mostrar el menú privado ni accesos contextuales a otros negocios. Para el piloto se pueden enumerar solo sus UUID en `NEXT_PUBLIC_STUDIO_PILOT_TENANT_IDS`. Estas banderas no conceden permisos ni sustituyen la autorización del servidor. No mezclar el laboratorio con una suscripción real. La ruta `/dashboard/plataforma/studio/pruebas` permite a un superadministrador probar editor y exportación local ahora mismo sin aplicar ninguna migración; su PNG se marca BORRADOR y no se guarda en la base. Para flujo completo usar un negocio piloto propio después de la configuración y QA. Estado remoto aún no verificado desde este repositorio.

### Vista local de la página pública

Con `STUDIO_PUBLIC_ENABLED=true` en `.env.local`, `/studio` y la sección de Studio en `/` quedan visibles. Reiniciar `npm run dev` si el servidor conserva la configuración anterior. Esta bandera no aplica migraciones ni configura cobros.

Si todavía no existen `studio_plans` o `studio_credit_packs`, el lector público identifica `42P01`/`PGRST205` y muestra las tarifas aprobadas como **vista previa local**, sin contratación ni ofertas SEO. Una vez aplicadas las migraciones al proyecto configurado, usa los registros reales. Errores de conexión o permisos se muestran como catálogo no disponible, sin atribuirlos automáticamente a una migración. En producción nunca se usa el catálogo de vista previa.

## 3. QA y evidencia

La política local reserva automatizaciones para cuando el usuario envíe expresamente el trabajo a QA. Hasta ese momento los estados de esta tabla son **pendientes**, no aprobados.

| Validación | Preparación |
| --- | --- |
| lint / typecheck / test / test:integration / build:next | Scripts existentes de package.json. |
| React Doctor | `npx -y react-doctor@latest . --verbose --diff`, durante QA. |
| Reglas puras | `src/features/studio/helpers/studio.test.ts`. |
| Base de datos real | `src/test/integration/studio/studio.itest.ts`; transacciones con rollback preservan fixtures y ledger inmutable. |
| Navegador y capturas | `node scripts/studio/qa-browser.mjs`, con servidor de QA disponible y landing habilitada. |
| Editor, pagos y recuperación | Casos manuales de la especificación, con usuarios/tenants aislados. |

Variables del recorrido de navegador: STUDIO_QA_URL (por defecto localhost:3000), STUDIO_QA_STORAGE_STATE y STUDIO_QA_TENANT_SLUG. La sesión debe obtenerse legítimamente con una cuenta del entorno de prueba. Sin sesión, el script registra pendiente el recorrido privado; no lo simula. Capturas y resultados se escriben en artifacts/studio-qa, excluido de Git por poder contener diseños privados. No guardar cookies ni storageState en el repositorio.

El script comprueba landing en 360, 390, 768 y 1440 px, canonical, HTML/encabezado, JSON-LD y overflow. Con sesión captura home, biblioteca, publicaciones, monedero y marca. No contrata membresías, genera imágenes ni da por comprobada la fidelidad del editor.

Para cada ejecución registrar commit, entorno, migraciones, banderas, fecha, comando, resultado y archivo de evidencia. Separar fallos previos de regresiones. Las pruebas de RLS se ejecutan con rol authenticated; los fixtures superusuario no se presentan como prueba de autorización de aplicación.

### Benchmark previo a IA

Para cada combinación operación/calidad/proveedor/modelo: al menos 30 fotografías autorizadas de diversos giros. Registrar en un CSV privado:

`photo_id,giro,route_version,provider,model,quality,latency_ms,estimated_usd,actual_usd_known,product_identity,quantity,brand_text,lighting,background,approved,reviewer,notes`

No incluir fotos ni prompts completos en logs generales. Revisar identidad, cantidad, forma, colores, marca, errores en letras y rechazo de cambios comerciales. Registrar latencia p50/p95, tasa de falla, costo por éxito y peores casos. No habilitar una ruta que exceda presupuesto o falle fidelidad. Los nombres de modelo se verifican contra la documentación vigente antes de configurarlos. Las estimaciones y costos reales conocidos se reportan por separado.

## 4. Supervisión

Panel: `/dashboard/plataforma/studio`, solo administradores de plataforma. Muestra membresías, pagos, jobs, reservas y errores recientes, presupuestos y estimaciones. La lista está acotada; no representa totales históricos. El ajuste de cortesía permite 1–500 Tlacos, requiere motivo e idempotencia y escribe actividad/ledger; no modifica saldos desde el navegador.

Comprobar en `studio_health.sql`: jobs antiguos, reservas held, eventos fallidos, lotes inconsistentes, colocaciones suspendidas y bucket. Alertar desde la infraestructura sobre antigüedad de cola, reservas fuera de ventana, aumento de fallos, gasto próximo al límite, reversiones y falta de conciliación. Nunca registrar secretos, imágenes completas ni prompts en esos avisos.

La conciliación HTTP tiene autenticación independiente, ventana de trabajo de 45 segundos y llamadas al proveedor acotadas por el tiempo restante. Reintenta eventos, recargas, pagos aprobados y contratos por lotes/turnos, con tiempo reservado por grupo y para limpieza; los siguientes cron continúan el trabajo pendiente. Una falta de información verificable no se convierte en un pago aprobado.

## 5. Recuperación por escenario

| Situación | Procedimiento |
| --- | --- |
| Retorno de pago pendiente | Consultar evento/pago y recurso real. Esperar webhook o conciliación. No activar manualmente la suscripción ni insertar grants sueltos. |
| Timeout creando preapproval | Mantener intención pendiente; buscar por external_reference. Vincular únicamente un contrato inequívoco. Si hay ambigüedad, revisión financiera antes de liberar otra contratación. |
| Evento de recarga duplicado | Verificar que payment, order y grant existentes corresponden; RPC devuelve resultado previo. |
| Webhook fuera de orden | Volver a consultar el recurso; no aplicar el payload como fuente de estado. Revisar periodos ya aprobados antes de cambiar fechas. |
| Cambio de plan con respuesta perdida | Revisar la intención pendiente y el importe real del preapproval. Conciliación confirma o reintenta el mismo cambio autorizado; no inicia otro contrato ni agrega créditos al periodo actual. |
| Reembolso parcial | Conservar saldo, registrar importe y pausar IA hasta revisar pago/consumo. No se inventa una conversión proporcional de dinero a Tlacos. Plataforma puede registrar una resolución con motivo mediante la RPC de soporte, sin alterar el saldo ni borrar evidencia. |
| Reembolso/contracargo | Revertir por la RPC auditada; conservar evidencia. Si hubo consumo, mantener IA bloqueada hasta resolver soporte. No cobrar diferencia ni borrar diseños. |
| Job abandonado | Pausar despacho si el proveedor está inestable. Conciliación libera reserva tras timeout y registra error. No reenviar una solicitud de resultado desconocido. |
| Polling FLUX pendiente | Conservar request_id/polling_url; consultar el mismo resultado. No crear una generación nueva para recuperar ese job. |
| Saldo reservado aparentemente perdido | Revisar reservation/items/ledger/job. Liberar únicamente mediante RPC transaccional y con causa operativa registrada, nunca editando remaining/reserved directamente. |
| Fuente o precio cambiado | El resolver deja de entregar el arte. Abrir Studio, actualizar desde catálogo, revisar y aplicar una nueva versión. |
| Archivo retirado en cliente abierto | El endpoint devuelve no elegible y el cliente retira el arte. Comprobar que no pase por la optimización anual ni caché PWA. |
| Upload pendiente/objeto huérfano | Conciliación espera 24 h y vuelve a comprobar referencias. No borrar carpetas completas por antigüedad. |
| Conflicto entre pestañas | Recargar la versión del servidor o preservar la recuperación local y usar una copia al tener membresía; nunca sobrescribir a ciegas. |
| Exportador actualizado | Guardar los cambios y recargar Studio antes de exportar. Una versión nueva del exportador produce otro render; no reemplazar archivos históricos ni modificar sus registros. |

## 6. Pausa y reversión operativa

1. Desactivar STUDIO_CHECKOUT_ENABLED y STUDIO_AI_ENABLED; en Edge desactivar también IA. Mantener STUDIO_BILLING_WEBHOOK_ENABLED para pagos ya iniciados.
2. Pausar el Cron de despacho conservando cola y jobs. Permitir terminar o conciliar trabajos ya iniciados según su resultado conocido.
3. Si se necesita retirar toda distribución, desactivar STUDIO_PUBLISH_ENABLED; los originales siguen su flujo habitual.
4. Desactivar adquisición pública si las capacidades ofrecidas no están disponibles. Conservar lectura y descarga de lo ya adquirido.
5. El snippet `studio_rollback.sql` detiene programación y desactiva rutas/colocaciones sin DROP ni borrado financiero. Revisar primero qué tareas deben continuar para conciliación financiera; puede reactivarse únicamente studio-reconcile tras corregir el incidente.
6. Corregir esquema mediante migraciones nuevas. No reescribir las cuatro migraciones después de aplicarlas.

Retirar anuncios en Tlaco no retira los archivos compartidos fuera de la plataforma. Cancelar el servicio comercial y apagar nuevas contrataciones son acciones distintas: los contratos recurrentes existentes necesitan cancelación por su flujo verificado si se decide detener cargos.

## 7. Registro de entrega

| Evidencia | Estado de esta implementación |
| --- | --- |
| Rama/base y código local | Preparados. |
| Migraciones, RPC, contratos y worker | Aplicados en Supabase local; sin aplicación remota. |
| Tipos generados del esquema real | Generados del esquema local (8 nov 2026). |
| Tests unitarios/integración | Ejecutados en local el 8 nov 2026: unitarias 522/522; integración 119/123, con `studio.itest.ts` 12/12. Las 4 que fallan (`planCheckout` ×3, `ledger` ×1) ya fallaban en `qa_release` por el flujo de términos legales. |
| Recorrido de navegador | Escrito, sin ejecutar. |
| Capturas y métricas de experiencia | Pendientes de QA. |
| Sandbox Mercado Pago | Pendiente de credenciales y configuración. |
| Benchmark y rutas IA habilitadas | Pendientes; rutas apagadas y presupuestos cero. |
| Cron/Vault/alertas/piloto/Search Console | Pendientes del entorno. |

No registrar estas tareas como aprobadas por el solo hecho de que exista su código o comando.
