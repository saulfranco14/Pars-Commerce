# Tlaco Studio: especificación principal e implementación

Actualización: 2 de noviembre de 2026. Rama: `feature/tlaco-studio`. Base real: `feat/prospeccion-equipo`, commit `7437af1`.

Este documento sustituye la especificación anterior y consolida las decisiones aprobadas para producto, SEO, integración, Supabase y operación. El código está en desarrollo local. **No acredita un despliegue, cobros verificados en sandbox, QA aprobado ni proveedores habilitados.** Las migraciones no se han aplicado a un proyecto remoto y la adquisición permanece apagada por defecto.

## 1. Decisiones de producto

- Una página comercial en `https://tlaco.app/studio`; el editor pertenece al negocio en `/dashboard/[tenantSlug]/studio`.
- Registro y negocio Tlaco existentes. Studio conserva la intención de entrada durante registro y preparación, sin volver a pedir el catálogo.
- Studio es una membresía adicional **por negocio**, independiente de `free`, `operation`, `growth` y `scale`. Los planes vendidos por el comerciante siguen en `offer_plans`.
- Explorar herramientas, formatos y ejemplos no requiere pagar. Iniciar un diseño propio, duplicar, editar y aplicar nuevas colocaciones exige membresía vigente y el permiso correspondiente.
- Edición manual, plantillas y exportación: **0 Tlacos**. IA económica: 1 Tlaco; premium: 2, con cotización y confirmación previa.
- El acceso de escritura corresponde al intervalo pagado: no comienza antes de `current_period_start` y termina exactamente en `current_period_end`. Al vencer se permiten consulta y descarga de archivos ya guardados. No se permite exportar composiciones nuevas. Se conservan publicaciones elegibles y se permite retirarlas.
- Los Tlacos mensuales vencen al cerrar el periodo pagado; las recargas se conservan. Se consume primero el saldo mensual próximo a vencer.
- Cancelar detiene renovaciones, conservando el periodo pagado. Cambiar plan aplica a la siguiente renovación; no hay prorrateo ni créditos adicionales inmediatos.
- Compartir significa descargar, copiar o abrir el mecanismo nativo. `wa.me` prepara texto y enlace; no adjunta automáticamente el PNG. No hay publicación automática en Meta.
- Una campaña libre no crea descuentos, promociones ni productos. Sus enlaces HTTPS se validan y necesita fin de vigencia para aplicarse.
- Una autorización de preapproval y un retorno exitoso del navegador **no equivalen a pago aprobado**.

### Catálogo inicial confirmado

Precios finales MXN, IVA incluido. La base es la fuente para landing, panel y checkout.

| Membresía mensual | Precio | Tlacos | Diagnósticos visuales por periodo |
| --- | ---: | ---: | ---: |
| Studio Básico (`basic`) | $99 | 20 | 40 |
| Studio Pro (`pro`) | $199 | 60 | 120 |
| Studio Negocio (`business`) | $349 | 140 | 280 |

La cuota de diagnóstico es una configuración operativa inicial; también existe un máximo de dos diagnósticos completados por diseño. Los fallidos no agotan la cuota, aunque su costo estimado sí permanece en el presupuesto operativo.

| Recarga | Código | Precio | Tlacos |
| --- | --- | ---: | ---: |
| Mini | `mini` | $49 | 10 |
| Frecuente | `frequent` | $129 | 30 |
| Negocio | `business` | $279 | 75 |

Los cambios comerciales incrementan `catalog_version`. El cliente confirma esa versión; un precio o beneficio modificado exige actualizar y confirmar antes de continuar al cobro.

## 2. Estado y fases

| Fase | Implementación local | Criterio pendiente de cierre |
| --- | --- | --- |
| 0. Base | Rama aislada, contratos y documento consolidado. Se preservaron logos existentes. | Revisar diff con el responsable. |
| 1. Acceso | Menú, permisos, rutas, exploración y bloqueos de servidor. | QA de roles, invitados, suspendidos y varios negocios. |
| 2. Datos | Migraciones, fuentes, subida privada, snapshots y revisión optimista. | Aplicación en Supabase aislado y tipos generados del esquema real. |
| 3. Editor | Konva, tres pasos, capas, plantillas, formatos, recuperación y PNG. | Fidelidad de render, fuentes, táctil, teclado y concurrencia. |
| 4. Cobros | Preapproval, recargas, webhook, periodos, ledger y conciliación. | Cuenta Tlaco configurada y pruebas reales en sandbox. |
| 5. IA | Cotización, reserva/cola atómica, worker, adaptadores y variantes. | Credenciales, presupuestos y benchmark de al menos 30 fotos por ruta. |
| 6. Distribución | Salida honesta, colocaciones, resolver por lotes y sitio/QR. | Elegibilidad, retiro, vigencias y caché en escenarios reales. |
| 7. Adquisición | Landing, SEO, navegación, registro y conocimiento de Tlaco IA. | Recorrido E2E completo y revisión de contenido comercial habilitado. |
| 8. Operación | Panel interno, laboratorio de edición super admin, ajustes auditados, Cron/Vault y recuperación documentada. | Piloto, alertas del entorno y evidencia de QA. |

**Ninguna fase se considera verificada antes de ejecutar su aceptación.** La política de `.agents/skills/react-doctor/SKILL.md` reserva lint, typecheck, tests, build, React Doctor y otras validaciones automatizadas para cuando el usuario envíe expresamente el trabajo a QA. Se prepararon pruebas, sin ejecutarlas durante esta implementación.

## 3. Página pública y SEO

`src/app/studio/page.tsx` es Server Component. Presenta propuesta, recorrido visual del editor, cinco usos, tres pasos, formatos, distribución, edición manual, IA cuando está habilitada, precios y preguntas. El editor real no forma parte del paquete público. `StudioEditorPreview` recorre automáticamente tres pasos: elegir contenido, componer las capas del anuncio y preparar formatos para descargar y compartir. Permite avanzar al siguiente paso, seleccionar negocio y formato, pausar y reanudar. La barra superior de pestañas de pasos se retiró tanto en Studio como en la portada; las explicaciones y el avance manual quedan junto a la escena. Utiliza HTML/CSS, sin canvas, generación ni persistencia. La publicación externa se completa en la aplicación elegida: el recorrido no simula una publicación realizada.

Los ejemplos cubren doce giros del catálogo de inicio: taquería, panadería, tenis, autolavado, mascotas, abarrotes, materiales, veterinaria, boutique, cafetería, expendio y otro negocio. Reutilizan fotografías ilustrativas de `public/landing`, con marcas y precios identificados como ejemplos, sin fotos privadas de comerciantes ni operaciones reales. `StudioExamplesGallery` presenta los doce giros en una sola fila con desplazamiento horizontal, avance automático, flechas y deslizamiento táctil. La barra de scroll nativa se oculta; los controles y la navegación por teclado permanecen disponibles. Permite tocar cada anuncio para comparar con la fotografía original; combina composiciones clásicas, editoriales y enmarcadas. `StudioWordmark` reutiliza el componente de marca `TlacoLogo` en la presentación, el editor ilustrativo y la sección de portada.

La portada `/` incluye `LandingStudio` después de `LandingStats`: sección propia con `StudioHomeShowcase`, el mismo recorrido de tres pasos y enlace directo a `/studio`, condicionada por la bandera pública. Se puede enlazar mediante `/#tlaco-studio`. El lenguaje visual conserva tipografía amplia, composiciones fotográficas y contraste entre superficies claras y oscuras. El arte social mantiene esa presentación.

`useStudioShowcase` centraliza la reproducción. El avance se detiene fuera de pantalla, con la pestaña oculta, al interactuar mediante foco y al elegir manualmente un paso o ejemplo; la galería también pausa al pasar el puntero, deslizar o usar la rueda. En los recorridos, pasar el puntero no interrumpe la demostración; existe un control explícito para reanudar. La preferencia de movimiento reducido desactiva el inicio automático y las animaciones decorativas. El tiempo restante se conserva al pausar. Los temporizadores y observadores se limpian al desmontar. El recorrido comparte una línea de tiempo de 6,5 segundos por paso con un cursor ilustrativo: selecciona la foto, destaca título y precio y señala la preparación de descarga. Los clics son animaciones, sin acciones reales. Las explicaciones cambian junto al cursor. Pausar detiene las animaciones; la selección manual y movimiento reducido muestran el contenido estático. La portada reutiliza ese recorrido con dimensiones acotadas para que los formatos no salgan del panel. No se registra un evento de adquisición por cada transición automática.

La nota de recargas explica el valor de reutilizar: una imagen puede adaptarse a publicaciones, historias y banners sin otra generación. La IA mantiene su costo de 1 Tlaco en económica y 2 en premium, con confirmación previa; si está deshabilitada, la nota lo expresa como disponibilidad futura. Edición manual y descargas consumen 0 Tlacos con membresía vigente. Al vencer se conserva la consulta y descarga de archivos guardados; editar exige reactivar. No se prometen ahorros comparativos sin evidencia ni veinte generaciones por cinco Tlacos.

Pendiente de QA visual e interactivo: recorrer los tres pasos en móvil y escritorio, cambiar formatos y los doce giros, comparar originales, pausar/reanudar, comprobar teclado y movimiento reducido, y confirmar que los cambios automáticos no corten la lectura ni oculten precios. Revisar también la sección de portada y el contraste de la marca en modo claro/oscuro. Esta implementación no constituye evidencia de esas comprobaciones.

Los layouts públicos de portada y Studio reutilizan `NavigationFeedback`, con la barra de progreso existente. `FeedbackLink` muestra la espera real de Next mediante `useLinkStatus`, conservando anclas, aperturas en otra pestaña y dimensiones del CTA. Studio y su entrada tienen pantallas `loading.tsx` con esqueletos. Los cambios manuales de ejemplo, formato y comparación usan View Transitions nativas con detección de soporte y preferencia de movimiento reducido; el avance automático no captura transiciones de toda la página. Se conservan los estilos globales existentes. Los ejemplos editoriales oscuros añaden contraste sobre la foto para mantener legibles título y marca. Pendiente de QA: carga lenta, navegación cancelada, cambios manuales rápidos, teclado, navegador sin View Transitions y reducción de movimiento.

El catálogo comercial sigue leyendo Supabase. La landing distingue `live`, `preview` y `unavailable`: únicamente en desarrollo y ante errores de tablas inexistentes (`42P01`, `PGRST205`) presenta las tarifas de lanzamiento aprobadas, etiquetadas como vista previa. No se utilizan en checkout, API privada, conocimiento de Tlaco IA ni ofertas estructuradas de SEO. En producción, una falla de catálogo muestra indisponibilidad, sin inventar planes disponibles. El diagnóstico público registra código y orientación en servidor; una migración faltante no dispara el error genérico del editor.

El CTA principal dice “Crear mi primer diseño” y explica que requiere membresía. “Crear cuenta” describe únicamente el registro de Tlaco.

| Elemento | Contrato |
| --- | --- |
| Canonical | `/studio`, independiente de UTM y plan considerado. |
| Título | `Tlaco Studio | Crea anuncios para tu negocio`. |
| Imagen social | `studio/opengraph-image.tsx`, 1200 × 630. |
| Idioma | Español, contexto México; fechas comerciales en America/Mexico_City. |
| Datos estructurados | WebPage, BreadcrumbList, WebApplication y ofertas del catálogo. |
| Sitemap | Una entrada `/studio`, fecha de contenido fija en `STUDIO_CONTENT_UPDATED_AT`. |
| Privacidad SEO | Entrada, dashboard, editor y API con noindex; sin URLs privadas en sitemap. |
| Rendimiento | HTML principal, imágenes dimensionadas, editor dinámico cliente, sin IA ni pagos en landing. |

No se inventan reseñas ni se promete FAQ enriquecido. No se generan páginas duplicadas por palabra clave. Objetivos a medir en QA y después con datos reales: LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.

`LandingNav` y `LandingFooter` reciben navegación y CTA por props; mantienen sus defaults en la portada y usan anclas específicas en Studio. La portada y soluciones enlazan Studio cuando la bandera pública está activa. Precios y FAQ distinguen el complemento de los planes operativos. El catálogo Studio participa en el hash del conocimiento de Tlaco IA, para invalidar respuestas tras cambios comerciales.

### Entrada y atribución

`/studio/entrar` conserva plan considerado y acción; ofrece acceso o registro sin sesión. Con sesión inventaría las relaciones del usuario y autoriza únicamente membresías aceptadas, vigentes y con permiso. Una invitación pendiente no se interpreta como ausencia de negocio. Un usuario con varios negocios elige explícitamente; un colaborador sin permiso recibe una explicación. Sin negocio, continúa en creación y preparación existentes. La intención queda en metadata de registro y `tenants.settings.registration_intent`; `RegistrationIntent.plan` conserva su significado operativo.

El final de preparación de una entrada Studio conduce a Studio y evita encadenar el modal de membresía operativa. La membresía Studio nunca se activa automáticamente.

Eventos: `studio_landing_view`, `studio_example_view`, `studio_cta_click`, `studio_entry_resolved`, `studio_membership_started`, `studio_membership_activated`. La activación se informa después de observar un estado pagado verificado. Los eventos conservan la atribución existente y no incluyen imágenes, prompts, correos ni datos personales.

### Acceso de prueba para superadministradores

`/dashboard/plataforma/studio/pruebas` es un laboratorio protegido por sesión e `isPlatformAdmin` en servidor. Reutiliza el lienzo Konva, panel de capas, propiedades, plantillas, formatos, deshacer/rehacer y exportador PNG de Studio con doce fuentes ilustrativas locales. La exportación lleva la marca BORRADOR. El estado vive solo en la pestaña; no crea una membresía, negocio, pago, grant, trabajo de IA ni colocación. Desde `/studio/entrar`, un superadministrador sin tenant explícito entra al laboratorio. El sidebar ofrece «Probar Studio» y «Operación Studio» bajo Plataforma; una ruta de plataforma no presenta el selector de negocio mientras termina de cargar el rol. Esto no concede a los administradores acceso implícito a los diseños de negocios reales: para probar persistencia, cobros e IA se prepara un negocio piloto independiente con permisos y membresía de prueba verificada. La visibilidad privada para todos los negocios queda apagada con `NEXT_PUBLIC_STUDIO_BUSINESS_ENABLED=false`; durante el piloto, `NEXT_PUBLIC_STUDIO_PILOT_TENANT_IDS` puede mostrar el menú solo en los UUID indicados. Ambas variables controlan la interfaz y no reemplazan los permisos del servidor.

## 4. Acceso y rutas privadas

| Ruta bajo `/dashboard/[tenantSlug]/studio` | Responsabilidad |
| --- | --- |
| `/` | Membresía, saldo, exploración, plantillas y recientes. |
| `/nuevo` | Fuente y creación del borrador; acepta origen e ID. |
| `/disenos` | Biblioteca, búsqueda, estados, duplicado, archivo y descargas. |
| `/disenos/[designId]` | Editor y revisión/compartir. |
| `/publicaciones` | Colocaciones guardadas, vigencia y retiro. |
| `/tlacos` | Membresía, saldo, movimientos, planes y recargas. |
| `/configuracion` | Colores, tipografía y formato predeterminado. |

Menú `studio`, icono WandSparkles, después de Promociones y planes; respeta personalización y permisos. Las rutas de edición son de foco y no quedan cubiertas por navegación inferior. Todas las páginas privadas usan autorización en servidor; ocultar un botón no concede ni restringe datos por sí mismo.

| Permiso | Acción |
| --- | --- |
| `studio.read` | Explorar, consultar diseños autorizados y descargar existentes. |
| `studio.create` | Crear, editar, duplicar, archivar y solicitar IA con membresía. |
| `studio.publish` | Aplicar con membresía; retirar incluso vencida. |
| `studio.manage` | Preferencias, detalle financiero y recargas. |

Create, publish y manage requieren read. Solo owner contrata, cambia o cancela suscripción. Seleccionar fuente requiere además lectura de productos o promociones. Owner tiene todo; member de sistema recibe read/create; publicación y administración se asignan explícitamente. Los roles personalizados y operativos no reciben permisos nuevos automáticamente. La migración actualiza miembros existentes y un trigger cubre roles de futuros negocios.

### Matriz de membresía

| Acción | Inactiva/vencida | Activa, saldo cero | Activa, con saldo |
| --- | --- | --- | --- |
| Explorar, consultar, descargar ya exportado | Sí | Sí | Sí |
| Crear, duplicar, editar, exportar composición nueva | No | Sí | Sí |
| IA | No | No | Sí |
| Aplicar nueva colocación | No | Sí | Sí |
| Retirar, con permiso publish | Sí | Sí | Sí |

## 5. Componentes, hooks y contratos

El módulo vive en `src/features/studio`. Se reutilizan PageHeader, StatusBadge, EmptyState, Skeleton, FormInput, FormSheet, ConfirmDialog, FAB y Notification. Las páginas son contenedores pequeños.

| Grupo | Implementación y finalidad |
| --- | --- |
| Alcance | StudioProvider y summary: negocio explícito, permisos y estado real. |
| Home | StudioHome, MembershipSheet: exploración y siguiente acción. |
| Fuente | StudioSourceStep + useStudioSource: búsqueda paginada y deep links validados. |
| Editor | StudioEditorWorkspace, StudioCanvas, LayerPanel, PropertiesPanel: escena manipulable. |
| Estado | useStudioEditor: autosave, historia, revisión y recuperación local. |
| Imágenes | useStudioAssets + AssetService: originales, cargas firmadas y registro. |
| IA | ReviewPanel, GenerationSheet, VariantCompare + useStudioAi. |
| Salida | useStudioOutput, ShareStep, PlacementSheet: archivo revisado y resultados reales. |
| Biblioteca | StudioLibrary, DesignCard y useStudioLibrary. |
| Cobros | BillingPage, MembershipSheet y useStudioBilling. |
| Marca | StudioBrandPanel. |
| Público | LandingSections, EditorPreview, Pricing, Faq y EntryCta. |
| Distribución | StudioArtworkView, StudioCampaign y resolver compartido. |
| Operación | StudioPlatformPage, conciliación y ajuste con motivo auditado. |

Tipos en `interfaces`, reglas puras en `helpers`, catálogos en `constants`, validación en `validations`, red mediante `services/studioClientService.ts` y `apiFetch`. Los servicios de servidor comprueban actor, tenant y reglas antes de usar Service Role. El transporte HTTP convierte errores tipados en código y mensaje accionable; no expone errores SQL al usuario.

### Fuente comercial

Fuentes: products (también servicios), promotions, promociones bundle_price (combo), offer_plans/offer_plan_items y custom. Se conserva referencia, snapshot, hash de datos relevantes, artículos/cantidades, precio, periodicidad, condiciones, fotografías, destino y vigencia. El hash incluye artículos y variantes que modifican la oferta, no únicamente updated_at del padre.

Los nodos vinculados al catálogo se reescriben en servidor al guardar: cambiar un precio visualmente no cambia su valor comercial. La corrección comercial se realiza en el catálogo. IDs inválidos o de otro tenant responden recurso no disponible.

### Tres pasos exactos

1. **Elige contenido.** Selección validada y título; campaña libre permite fotografía propia. No crea datos comerciales ficticios.
2. **Diseña y mejora.** Konva 10.0.0 + react-konva 19.0.10 fijados para React 19.1.0; carga solo cliente bajo demanda. Escena JSON versión 1, IDs estables, coordenadas normalizadas, propiedades por tipo y referencias de assets. Texto, precio, imagen, logo, QR y figura; capas, orden, bloqueo, ocultamiento, duplicado, rotación, recorte y propiedades. Cuadrado 1080², vertical 1080×1350, historia 1080×1920 y banner 1600×700; reorganización por formato. Historia de hasta 50 escenas. Guardado después de aproximadamente un segundo sin cambios. Revisión esperada para detectar otra pestaña, sin sobrescritura silenciosa. Recuperación por usuario/tenant/diseño, incluidos título, texto y destino; limpieza al salir de sesión. No se reintentan automáticamente compras, generaciones ni publicaciones al reconectar.
3. **Revisa y comparte.** Guarda snapshot inmutable, renderiza y recupera el archivo efectivamente guardado para la vista final. Descarga PNG, copia texto, comparte archivo cuando el dispositivo lo soporte, prepara WhatsApp y aplica superficies autorizadas. El éxito se presenta fuera de los tres pasos y describe la acción observable.

Una versión no cambia al modificar el borrador. Las colocaciones apuntan a versión y render concretos. Las fotografías propias de Storage utilizadas en una versión se copian y normalizan en el bucket privado, para que reemplazar la imagen del catálogo no destruya el historial. Promociones inactivas/futuras/vencidas pueden exportarse como preparación con BORRADOR visible; no se aplican como oferta activa.

El diagnóstico local detecta área segura, tamaño, contraste y posible recorte de texto. Las correcciones geométricas se pueden deshacer sin Tlacos. Visión requiere consentimiento, cache por tenant/escena/fuente/evaluador y cuota; no certifica precios ni condiciones legales.

Cada render identifica su versión de exportador, además de composición, formato y superficie. La unicidad incluye esa versión: una actualización puede producir otro archivo sin alterar exportaciones históricas. Si el navegador conserva un exportador anterior al servidor, se solicita guardar y recargar antes de exportar.

### Integraciones existentes

| Superficie | Cambio |
| --- | --- |
| Productos, listado y detalle | Crear anuncio con ID real; el formulario ofrece el acceso después de guardar. |
| OfferListCard/OffersPage | Crear anuncio, compartir rápido y CTA posterior al guardado. |
| PlanListCard | Crear anuncio del plan vendido por el negocio. |
| Configuración del sitio | Abrir colocaciones para revisar/reemplazar/retirar. |
| Mesas y QR | Acceso a campañas y promociones presenciales. |
| Inicio del dashboard y novedades | Acceso contextual ligero sujeto a permiso. |
| Sitio, promoción, producto y planes públicos | Arte o campaña independiente de las reglas de compra. |
| Sesión de mesa/PromoBanner | Arte QR y campaña del menú, conservando mecánicas y carrito. |
| Plataforma | `/dashboard/plataforma/studio`, acceso exclusivo de plataforma. |

Estos accesos importan enlaces y tipos; no arrastran Konva al dashboard general.

## 6. API

Base `/api/studio`; endpoints privados reciben tenant explícito y validan sesión, membresía aceptada, rol, permiso y relaciones. Cuerpo JSON limitado, imágenes fuera del body de Next, destinos HTTPS y protección de origen en mutaciones. Respuestas privadas no-store/noindex. Paginación de fuentes y diseños por cursor.

| Recurso | Operaciones |
| --- | --- |
| `catalog`, `summary`, `sources` | Catálogo público filtrado, resumen privado y fuentes autorizadas. |
| `designs`, `designs/[id]` | Listar/crear, consultar/guardar con revisión. |
| `designs/[id]/versions`, `/duplicate`, `/renders` | Snapshot, duplicado y exportaciones existentes. |
| `assets`, `assets/import`, `assets/[id]/complete`, `/file` | Firma, copia de catálogo, normalización y entrega privada. |
| `ai/quote`, `ai/generate`, `ai/review` | Cotizar, confirmar/encolar (202) y diagnóstico consentido. |
| `jobs`, `jobs/[id]`, `/cancel` | Recuperar trabajos y cancelar mientras sigan en cola. |
| `placements`, `shares` | Consultar/aplicar/retirar y registrar salida observable. |
| `credits`, `membership` | Saldo/historial y estado pagado. |
| `membership/checkout`, `/change-plan`, `/cancel` | Contratación y cambios del owner. |
| `packs/checkout`, `brand` | Recargas autorizadas y preferencias. |
| `platform`, `platform/adjust`, `platform/reconcile`, `platform/resolve-review` | Supervisión, conciliación, ajustes y resolución con motivo auditado. |
| `reconcile` | Conciliación interna autenticada mediante secreto independiente. |

Claves de idempotencia en creación, cobros, jobs, colocaciones y eventos de salida. Precio, Tlacos y costos no se calculan desde datos enviados por el cliente. Cotización vencida o catálogo/ruta modificada exigen otra confirmación. Conflicto de revisión, falta de membresía, falta de saldo, cuota, presupuesto y error de proveedor se distinguen.

La ruta pública `/api/public/studio/media/[placementId]` valida colocación y fuente antes de entregar bytes; soporta HEAD para revalidación de clientes abiertos. No devuelve URLs firmadas persistentes ni expone el bucket.

## 7. Supabase

Migraciones nuevas, aditivas y posteriores a las existentes:

| Archivo | Contenido |
| --- | --- |
| `20261102000001_studio_core.sql` | Permisos, catálogos, membresía, diseños, versiones, assets, renders, marca, actividad y bucket. |
| `20261102000002_studio_billing_credits.sql` | Pagos, eventos, periodos, recargas, grants, reservas, asignaciones, ledger y RPC contables. |
| `20261102000003_studio_jobs_placements.sql` | PGMQ privado, rutas/cuotas/presupuestos, jobs, intentos, reviews, colocaciones y salida. |
| `20261102000004_studio_operations.sql` | Rate limits, checkout serializado, Cron/Vault, leases, reintentos, conciliación, ajustes y huérfanos. |

### Tablas y razón de existir

| Tabla/grupo | Propósito |
| --- | --- |
| studio_plans / studio_credit_packs | Catálogo comercial compartido y versionado. |
| tenant_studio_subscriptions | Contrato por negocio, pago actual y cambio pendiente. |
| studio_subscription_periods | Captura de condiciones por renovación; beneficios una sola vez. |
| studio_payments / studio_payment_events | Evidencia normalizada, verificación y reintentos. |
| studio_credit_orders | Condiciones capturadas de cada recarga. |
| studio_credit_grants | Lotes mensuales, comprados y ajustes; restante/reservado/vencimiento. |
| studio_credit_reservations / items | Retención por job y asignación exacta a lotes. |
| studio_credit_ledger | Auditoría inmutable de saldo y reservas. |
| studio_designs / versions | Borrador con revisión e historial inmutable. |
| studio_assets / renders | Archivo trazable y render por versión, formato y superficie. |
| studio_ai_routes / quotes | Ruta configurada y costo confirmado; snapshot de modelo/costos. |
| studio_ai_jobs / attempts | Trabajo durable, lease y solicitudes de proveedor auditables. |
| studio_ai_reviews | Cache de visión, hallazgos, cuota y estimación de costo conservada. |
| studio_placements / share_events | Aplicación específica e historial honesto de salida. |
| tenant_studio_brand_settings | Preferencias sin alterar marca global. |
| studio_activity_events | Autor, acción y entidad para soporte. |
| studio_runtime_limits / rate_limits | Presupuesto y límites de abuso. |

Todas las entidades privadas del negocio llevan tenant_id; catálogos y configuración interna son globales. No hay tabla de plantillas: viven versionadas en código junto al esquema de escena.

### Integridad y seguridad

Relaciones compuestas tenant/diseño/versión/asset; reserva única por job; pago externo único; periodo único; versión numerada única; una colocación activa por destino; montos decimales y Tlacos enteros; remaining/reserved no negativos y reservado ≤ restante. Ledger, versiones y registros de render son inmutables.

`studio_has_permission` verifica identidad, invitación, aceptación, suspensión, tenant y permiso. No usa el helper amplio is_tenant_member. RLS permite las lecturas autorizadas; no concede escrituras de navegador a tablas de negocio/finanzas. RPC financieras, cola, proveedores, presupuestos y operaciones solo service_role, con search_path fijo y EXECUTE revocado a PUBLIC/anon/authenticated. El actor deriva de la sesión del servidor.

`src/types/studio.database.ts` contiene un contrato tipado local del esquema nuevo y las columnas comerciales faltantes de los tipos históricos. **No se presenta como salida generada desde Supabase.** Después de aplicar a un entorno aislado se debe regenerar `src/types/database.types.ts` con la CLI y revisar/reducir el puente; ese paso está pendiente y forma parte de la entrega a QA.

### Storage y retención

Un bucket privado `studio-assets`. Rutas inmutables por tenant/diseño/tipo/ID. La base guarda rutas, no URLs firmadas de lectura. Subida: autorización → asset pendiente → firma → subida directa → confirmación → detección real y normalización → listo. JPG, PNG o WebP, máximo 12 MB y 24 megapíxeles; sin SVG, GIF ni animación. Se comprueba la firma binaria antes del decodificador; Sharp verifica contenido y dimensiones, rota y elimina metadatos de entrada. El worker inspecciona formato y dimensiones del resultado antes de capturar créditos. Un cliente no puede completar un asset generado por el worker.

Archivar no elimina imágenes. Se conservan assets referenciados por versiones, renders, jobs y diseños. La conciliación limpia pendientes de más de 24 h sin referencias y objetos Storage sin registro después de la misma ventana. La evidencia financiera nunca se elimina automáticamente.

## 8. Cobros y contabilidad

Cuenta de Tlaco mediante `getTlacoMercadoPagoAccessToken`; no usa OAuth del comerciante. Variables y pasos concretos están en [la guía de operación](TLACO_STUDIO_OPERACION.md).

1. Validar owner/catálogo y reclamar intención de checkout mediante RPC serializada.
2. Crear preapproval con precio capturado e idempotencia; guardar ID/URL.
3. Retorno pendiente al mismo negocio/diseño; nunca concede acceso.
4. Webhook firmado consulta el recurso real con credenciales de Tlaco.
5. Verificar moneda, receptor, referencia, importe y fecha aprobada.
6. Registrar pago, periodo y grant una sola vez; activar tras aprobación.

Recargas usan referencia `studio_credit_pack:<orderId>` y suscripciones `studio_subscription:<subscriptionId>`. El despacho Studio ocurre antes de los manejadores genéricos. Recursos de otra cuenta que Tlaco no puede consultar continúan al flujo existente. Datos incompletos permanecen pendientes de conciliación. No existe fallback que asuma approved.

El periodo recurrente utiliza debit_date, la siguiente frontera verificada del proveedor y el día original del contrato, conservándolo tras meses cortos; no se suman 30 días arbitrarios. Cambios y cancelaciones conservan el periodo pagado y no generan beneficios al fallar una renovación. El cambio de plan se registra primero como intención pendiente, se confirma contra el importe del proveedor y puede recuperarse por conciliación. Un pago al precio anterior no acredita los beneficios del nuevo plan ni borra una intención todavía pendiente. Se rechazan periodos superpuestos.

### Invariantes del monedero

- Disponible = remaining no vencido − reserved. Reservar no cobra.
- `reserve_studio_credits` asigna lotes mensuales primero, después comprados.
- `capture_studio_credits` consume una sola vez. `release_studio_credits` libera una sola vez.
- Si el lote venció durante la operación, liberarlo no resucita saldo.
- Crear job, reservar y enviar a PGMQ es una transacción: falla todo o se conserva todo.
- `grant_studio_subscription_credits`, `apply_studio_credit_purchase` y `expire_studio_credits` son transaccionales e idempotentes.
- Un reembolso/contracargo retira únicamente crédito no consumido, conserva historia y bloquea IA si hubo consumo o reservas. No hay lotes negativos, cargos automáticos de diferencias ni borrado de diseños.
- Un reembolso parcial conserva saldo e historia y abre revisión, sin aplicar una conversión de dinero a Tlacos no definida comercialmente. La resolución es explícita, exclusiva de plataforma, auditada y no modifica saldos.
- Un resultado que llega después de revertir el pago de su reserva no se entrega como generación cobrada.

## 9. IA y worker

Cola privada `studio_ai` mediante Supabase Queues/PGMQ; estado de negocio en studio_ai_jobs. Edge Function `studio-worker`; Cron despacha un trabajo por invocación y concilia por lotes. Programación desactivada hasta configurar Vault.

Cotización de 5 minutos → confirmación → reserva/cola → 202 → lease de worker → ejecución/poll → archivo determinista pendiente → listo + captura transaccional → archivo de mensaje. El navegador consulta progresivamente cada 2.5, 5 y 10 segundos según la antigüedad y se detiene al terminar. Un lease o resultado ambiguo no provoca una nueva solicitud externa sin consulta/idempotencia. Solo errores explícitamente reintentables (429) usan espera creciente, hasta tres envíos. Fallback utiliza una alternativa evaluada del snapshot con el mismo costo en Tlacos y la misma reserva. Se respetan dos trabajos concurrentes por tenant.

El modelo y estimación de costo se capturan por operación. El presupuesto se reserva de forma conservadora para hasta tres intentos usando la ruta más costosa aceptada; también cuenta diagnósticos fallidos. Las rutas se crean inactivas con estimación cero y los presupuestos en cero: sin configuración no hay generación. Se distinguen costos estimados y costos reales conocidos; no se inventa facturación exacta del proveedor.

Puertos y adaptadores en `supabase/functions/_shared/studio/providers.ts`: Gemini imagen/visión, OpenAI Image API para edición y Responses para visión, FLUX con polling autenticado. Ninguna clave va al navegador. Proveedores sin credenciales o modelos quedan fuera de la oferta efectiva. Se conserva fotografía y escena anterior; se genera una variante y los precios permanecen en capas.

Antes de habilitar una ruta: al menos 30 fotografías autorizadas de distintos giros, fidelidad de producto/marca/cantidad, rechazo de cambios comerciales, latencias, tasa de falla, costo por éxito y revisión humana registrada. Este benchmark **no se ejecutó** durante la implementación.

## 10. Colocaciones, entrega y caché

| Superficie | Origen | Formato | Canal |
| --- | --- | --- | --- |
| store_home_campaign | Todos | banner | public_store |
| promotion_card | Promoción/combo | square | public_store |
| promotion_detail | Promoción/combo | portrait | public_store |
| product_campaign | Producto/servicio | banner | public_store |
| plan_card | Plan comercial | square | public_store |
| plan_detail | Plan comercial | banner | public_store |
| qr_promotion | Promoción/combo | banner | table_qr → onsite |
| qr_menu_campaign | Todos | banner | table_qr → onsite |

El resolver consulta colocaciones por lotes, luego renders/assets; no agrega una consulta por tarjeta. Comprueba vigencia, fuente, estado, canales y hash comercial. No cambia precios ni mecánicas del carrito. Si el catálogo cambia, retira el arte y ofrece preparar/aprobar otra versión; no corrige silenciosamente una imagen publicada.

El bucket sigue privado. La entrega controlada usa no-store y evita la caché anual de next/image con `unoptimized` para arte Studio. Las fotos originales conservan su optimización habitual. Los clientes abiertos revisan expiración, visibilidad y elegibilidad periódicamente. PWA fuerza red para API y rutas privadas, incluidas respuestas RSC.

Retirar una colocación deja de mostrarla dentro de Tlaco y recupera su fallback. Los PNG ya enviados a terceros permanecen fuera del control de Studio.

## 11. QA preparado y aceptación pendiente

Pruebas puras: `src/features/studio/helpers/studio.test.ts` y `billingPeriods.test.ts`; pagos/webhooks en `src/features/studio/services/*.test.ts`. Integración real y rollback de fixtures: `src/test/integration/studio/studio.itest.ts`. Recorrido de navegador y capturas: `scripts/studio/qa-browser.mjs`. No se ejecutaron ni hay capturas fabricadas.

La aceptación incluye:

- SEO en HTML, canonical sin UTM, Open Graph, una sola entrada en sitemap y noindex privado.
- Registro, confirmación, recuperación, creación, preparación, legal y selección correcta de negocio; Studio separado del plan operativo.
- RLS por tenant, invitaciones/suspensión, read sin escritura, owner en suscripción, RPC financieras sin acceso de cliente.
- Mover/escalar texto y foto, undo/redo, formatos seguros, fuentes completas, reapertura y exportación fiel.
- Conflictos entre pestañas, pérdida de conexión, recuperación local y vencimiento durante edición sin perder trabajo.
- Un último Tlaco y solicitudes concurrentes, duplicados, fallo/fallback, liberación vencida, leases y cache/cuotas de visión.
- Retorno sin pago, autorización sin cobro, firma, cuenta receptora, moneda/importe, eventos repetidos/fuera de orden, renovación, cancelación, cambio de plan y contracargo parcial.
- Promoción vencida/pausada, canal onsite, cambio de precio, retiro/fallback, campañas libres sin alterar checkout y assets ajenos rechazados.
- 360/390 px, tablet y 1440 px; táctil ≥44 px, teclado/foco/lectores, claro/oscuro, safe area, paquetes y PWA sin datos cruzados.

Cuando el trabajo vaya a QA: lint, typecheck, tests unitarios e integración, build:next, React Doctor, navegador y Supabase aislado. Registrar fallos previos separadamente. No indexar ni promocionar antes de completar los recorridos ofrecidos.

## 12. Operación y pendientes externos

Ver [TLACO_STUDIO_OPERACION.md](TLACO_STUDIO_OPERACION.md) para variables, orden de despliegue, conciliación, pausa, recuperación, benchmark y evidencias.

Pendientes externos: proyecto Supabase aislado, migraciones y generación de tipos, despliegue de Edge Function, secretos de Next/Edge/Vault, cuenta y webhooks Mercado Pago, modelos/costos/presupuestos aprobados, benchmark, piloto, QA, alertas del entorno y Search Console. No se sustituyen con pagos o generaciones simuladas.

Referencias oficiales: [Next metadata](https://nextjs.org/docs/15/app/getting-started/metadata-and-og-images), [Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Supabase Queues](https://supabase.com/docs/guides/queues/pgmq), [programar Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions), [límites de Edge Functions](https://supabase.com/docs/guides/functions/limits), [Mercado Pago subscriptions](https://www.mercadopago.com.mx/developers/en/reference/online-payments/subscriptions/overview), [OpenAI image generation](https://developers.openai.com/api/docs/guides/image-generation).
