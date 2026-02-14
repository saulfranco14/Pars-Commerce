# Plan: E-commerce marca blanca por negocio

Documento completo con casos de uso detallados, formularios, URLs, seguridad y fases de implementación.

---

## 1. Estado actual

- Sitio público: una sola página con secciones por hash (#inicio, #productos). Solo productos tiene contenido dinámico.
- tenant_site_pages: tiene content (jsonb) pero no se usa.
- Carrito actual: pensado para servicios, no para productos e-commerce.
- Promociones: tabla existe, sin API ni UI.
- MercadoPago: ya integrado para órdenes del dashboard.
- Orders: soportan product_id, promotion_id, source.

---

## 2. Casos de uso (detallados)

### 2.1 Negocio – configuración y personalización

**UC01 – Dar de alta contenido de Inicio**
- Flujo: Configuración → Contenido del sitio → Inicio. Completa título, subtítulo, imagen hero, texto de bienvenida. Guarda.
- Resultado: El sitio público muestra su portada personalizada al entrar a /inicio.

**UC02 – Dar de alta contenido de Nosotros**
- Flujo: Configuración → Nosotros. Escribe historia/misión en editor (texto enriquecido). Sube foto opcional.
- Resultado: Página /nosotros muestra su relato con formato e imagen.

**UC03 – Dar de alta contenido de Contacto**
- Flujo: Configuración → Contacto. Ingresa email, teléfono, dirección, horario. Opcional: iframe de mapa.
- Resultado: Página /contacto muestra sus datos y mapa si lo agregó.

**UC04 – Habilitar/ocultar secciones**
- Flujo: Configuración → Secciones. Activa o desactiva Inicio, Productos, Promociones, Nosotros, Contacto. Define orden.
- Resultado: La navegación del sitio solo muestra secciones activas en el orden elegido.

**UC05 – Publicar productos en la tienda**
- Flujo: Productos → editar producto → marcar "Visible en sitio público".
- Resultado: El producto aparece en /productos con imagen, precio y botón Añadir al carrito.

**UC06 – Crear promoción**
- Flujo: Promociones → Nueva. Define nombre, tipo (%), valor, mínimo, productos, vigencia.
- Resultado: La promoción se muestra en /promociones y se aplica en checkout si aplica.

### 2.2 Cliente – compra en sitio e-commerce

**UC07 – Navegar y ver catálogo**
- Flujo: Cliente entra a /sitio/regalos-jazmin (por slug único). Ve Inicio, Productos, Promociones, Nosotros, Contacto.
- Resultado: Experimenta la tienda como e-commerce con contenido personalizado del negocio.

**UC08 – Añadir al carrito**
- Flujo: En producto, elige cantidad y "Añadir al carrito". Carrito identificado por fingerprint o sesión.
- Resultado: Badge del carrito se actualiza; ítem persiste al navegar.

**UC09 – Ver y editar carrito**
- Flujo: Va a /carrito. Modifica cantidades o elimina ítems.
- Resultado: Ve total actualizado en tiempo real.

**UC10 – Checkout**
- Flujo: Carrito → Checkout. Ingresa nombre, email, teléfono. Elige promoción si aplica. Genera pago.
- Resultado: Redirige a MercadoPago con la orden creada.

**UC11 – Completar pago**
- Flujo: Paga en MercadoPago. Regresa a /confirmacion.
- Resultado: Ve confirmación; orden queda en estado paid en dashboard del negocio.

### 2.3 Sistema

**UC12 – Procesar webhook MercadoPago**
- Recibe notificación; actualiza orden a paid; vacía carrito asociado.

**UC13 – Sanitizar HTML al guardar**
- Antes de persistir content en tenant_site_pages, sanitiza con DOMPurify para evitar XSS.

---

## 3. Formularios para dar de alta la data

### 3.1 Formulario: Inicio (/inicio)

| Campo            | Tipo                    | Validación      | Guardado              |
|-----------------|-------------------------|-----------------|------------------------|
| Título principal| text, max 80            | Requerido       | content.title          |
| Subtítulo       | text, max 120           | Opcional        | content.subtitle       |
| Imagen destacada| upload (jpg/png, 2MB)   | Opcional        | content.hero_image_url |
| Texto bienvenida| textarea, max 500       | Opcional, HTML  | content.welcome_text   |

### 3.2 Formulario: Nosotros (/nosotros)

| Campo    | Tipo                   | Validación        | Guardado       |
|----------|------------------------|-------------------|----------------|
| Título   | text, max 80           | Opcional          | content.title  |
| Contenido| textarea enriquecido    | Requerido, sanitizado | content.body |
| Imagen   | upload                 | Opcional          | content.image_url |

### 3.3 Formulario: Contacto (/contacto)

| Campo          | Tipo      | Validación     | Guardado              |
|----------------|-----------|----------------|------------------------|
| Email          | email     | Requerido      | content.email         |
| Teléfono       | tel       | Requerido      | content.phone         |
| Dirección      | text 200  | Opcional       | content.address_text  |
| Horario        | text 100  | Opcional       | content.schedule      |
| Mensaje bienvenida | textarea  | Opcional, HTML | content.welcome_message |
| Mapa embebido  | iframe    | Solo Google Maps | content.map_embed   |

### 3.4 Formulario: Promociones (Dashboard)

| Campo          | Tipo      | Validación     | Guardado          |
|----------------|-----------|----------------|-------------------|
| Nombre         | text 100  | Requerido      | promotions.name   |
| Tipo           | select    | % o monto fijo | promotions.type   |
| Valor          | number    | > 0            | promotions.value  |
| Mínimo compra   | number    | >= 0           | promotions.min_amount |
| Productos      | multi-select | Opcional   | promotions.product_ids |
| Vigencia desde | date      | Opcional       | promotions.valid_from |
| Vigencia hasta | date      | Requerido si desde | promotions.valid_until |

---

## 4. URLs limpias (sin #)

Todas las secciones son rutas propias:

- /sitio/[slug] o /sitio/[slug]/inicio  → Inicio
- /sitio/[slug]/productos   → Catálogo
- /sitio/[slug]/promociones → Promociones
- /sitio/[slug]/nosotros    → Quiénes somos
- /sitio/[slug]/contacto    → Contacto
- /sitio/[slug]/carrito     → Carrito
- /sitio/[slug]/checkout    → Checkout
- /sitio/[slug]/confirmacion → Confirmación

Ejemplo: tudominio.com/sitio/regalos-jazmin/contacto

---

## 5. Identificación única por tenant

- URL pública: slug único (ej: regalos-jazmin). Constraint UNIQUE en tenants.slug.
- API/backend: tenant_id (UUID) para carrito, checkout, órdenes.
- Si dos negocios tienen el mismo nombre, cada uno tiene slug diferente (ej: regalos-jazmin, regalos-jazmin-polanco).

---

## 6. Sanitización HTML (seguridad)

- Librería: DOMPurify / isomorphic-dompurify.
- Al guardar: sanitizar content.body, welcome_text, welcome_message antes de persistir.
- Permitir: p, strong, em, ul, ol, li, a, img.
- Bloquear: script, iframe (o whitelist solo Google Maps), form.

---

## 7. Cambios en base de datos

### 7.1 Carrito público

- public_carts: id, tenant_id, fingerprint_id, user_id, created_at, updated_at
- public_cart_items: id, cart_id, product_id, quantity, price_snapshot, added_at

### 7.2 Estructura content (tenant_site_pages)

- inicio: { title, subtitle, hero_image_url?, welcome_text? }
- nosotros: { title?, body, image_url? }
- contacto: { title?, email, phone, address_text?, schedule?, map_embed?, welcome_message? }

### 7.3 Orders

- source = 'public_store'
- user_id nullable para compras anónimas

---

## 8. Implementación por fases

**Fase 1**: Migración public_carts, API public-cart, publicCartService.

**Fase 2**: PATCH tenant-site-pages con sanitización, formularios en Configuración (Inicio, Nosotros, Contacto).

**Fase 3**: API CRUD promotions, página Dashboard Promociones, sección promociones en sitio.

**Fase 4**: API public-checkout sin auth, crear order desde cart, preference MercadoPago.

**Fase 5**: Layout sitio público, páginas por ruta (inicio, productos, promociones, nosotros, contacto, carrito, checkout, confirmacion).

**Fase 6**: Back URLs MercadoPago, webhook para órdenes public_store.

---

## 9. Archivos a crear o modificar

- supabase/migrations/YYYYMMDD_public_cart.sql
- src/app/api/public-cart/route.ts
- src/app/api/public-checkout/route.ts
- src/app/api/promotions/route.ts
- src/app/api/tenant-site-pages/route.ts (PATCH + sanitizar)
- src/lib/sanitizeHtml.ts
- src/services/publicCartService.ts
- src/services/promotionsService.ts
- src/app/sitio/[slug]/layout.tsx
- src/app/sitio/[slug]/inicio/page.tsx
- src/app/sitio/[slug]/productos/page.tsx
- src/app/sitio/[slug]/promociones/page.tsx
- src/app/sitio/[slug]/nosotros/page.tsx
- src/app/sitio/[slug]/contacto/page.tsx
- src/app/sitio/[slug]/carrito/page.tsx
- src/app/sitio/[slug]/checkout/page.tsx
- src/app/sitio/[slug]/confirmacion/page.tsx
- src/app/dashboard/[tenantSlug]/configuracion/page.tsx (tabs: Datos + Contenido)
- src/app/dashboard/[tenantSlug]/promociones/page.tsx

Dependencia: npm install isomorphic-dompurify

---

## 10. Flujo de datos: formularios → sitio público

Formulario → PATCH API → Sanitizar HTML → Guardar en tenant_site_pages → Render en sitio
