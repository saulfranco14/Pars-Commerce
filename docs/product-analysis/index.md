# Tlaco — Product & Business Analysis

> Documento maestro para evaluar Tlaco desde diferentes perspectivas antes y durante su comercialización.

---

# 1. ¿Qué es Tlaco?

Tlaco es una plataforma SaaS orientada a pequeños y medianos negocios que busca centralizar ventas, operación y administración en un mismo ecosistema.

La visión no es construir únicamente un POS, sistema de pedidos, menú QR o tienda en línea.

La visión es construir:

> **El sistema operativo para pequeños negocios.**

Una plataforma donde las diferentes formas de vender y operar un negocio compartan la misma información.

---

# 2. Propuesta de valor

## Propuesta principal

> **Tlaco ayuda a los pequeños negocios a vender, operar y crecer desde un solo lugar.**

El objetivo es evitar que un negocio necesite diferentes herramientas desconectadas para administrar:

- Ventas
- Productos
- Inventario
- Órdenes
- Mesas
- Clientes
- Pagos
- Sitio web
- Kiosco
- Finanzas
- Suscripciones
- Financiamiento

La información debe vivir dentro del mismo ecosistema.

---

# 3. El problema que queremos resolver

Muchos pequeños negocios operan actualmente utilizando una combinación de:

- Excel
- WhatsApp
- Notas
- Calculadora
- Terminal bancaria
- Sistemas POS
- Plataformas de delivery
- Aplicaciones bancarias
- Sistemas de inventario
- Tiendas en línea independientes

Esto provoca información fragmentada.

Tlaco busca convertirse en el punto central desde donde el negocio pueda operar.

---

# 4. Principio del producto

Cada módulo de Tlaco debe compartir información con los demás.

Ejemplo:

```text
Cliente
   │
   ├── Caja
   ├── QR
   ├── Kiosco
   ├── Sitio web
   └── Pedido
        │
        ▼
      Orden
        │
        ├── Venta
        ├── Inventario
        ├── Cliente
        └── Pago
             │
             ▼
         Mi Dinero
             │
             ├── Flujo
             ├── Gastos
             ├── Utilidad
             └── Historial
                  │
                  ▼
             Inteligencia
                  │
                  └── Financiamiento
```

La ventaja no debe ser tener muchos módulos.

La ventaja debe ser que **todos los módulos entienden el mismo negocio**.

---

# 5. Módulos actuales / planteados

## Operación

- Productos
- Inventario
- Órdenes
- Mesas
- Clientes
- Empleados
- Sucursales

## Canales de venta

- Punto de venta
- QR
- Kiosco
- Sitio web
- Pedidos

## Finanzas

- Mi Dinero
- Ventas
- Gastos
- Flujo
- Suscripciones
- Financiamiento / préstamos

## Administración

- Usuarios
- Roles
- Permisos
- Configuración del negocio

---

# 6. Kiosco

El kiosco no debe considerarse un producto independiente.

Debe ser otro canal de venta conectado al mismo motor de Tlaco.

```text
POS ───────────┐
QR ────────────┤
Kiosco ────────┼──► Orders
Sitio web ─────┤
Mesas ─────────┘
                   │
                   ▼
                Payments
                   │
          ┌────────┴────────┐
          ▼                 ▼
      Inventory         Mi Dinero
```

Esto permite que independientemente de dónde llegue una venta, Tlaco pueda entenderla de la misma manera.

El kiosco puede convertirse en una ventaja especialmente para:

- Taquerías
- Restaurantes
- Cafeterías
- Fast food
- Heladerías
- Panaderías
- Negocios con alto volumen

A futuro pueden existir diferentes experiencias de kiosco utilizando el mismo motor.

---

# 7. Competidores

Tlaco compite directa o indirectamente con diferentes categorías.

## POS / restaurantes

- Fudo
- Soft Restaurant
- Parrot
- Poster
- Loyverse

## Comercio / administración

- Ordena
- SICAR
- eleventa

## Plataformas internacionales

- Square
- Toast
- Shopify
- Lightspeed
- Clover

## ERP

- Odoo

Sin embargo, probablemente el principal competidor inicial de Tlaco no sea otra empresa.

Es:

> Excel + WhatsApp + papel + falta de control.

---

# 8. Lo que NO debe ser nuestra diferenciación

No podemos depender exclusivamente de funcionalidades como:

- QR
- POS
- Inventario
- Mesas
- Kiosco
- Página web
- Reportes

Todas pueden ser copiadas.

Además, diferentes competidores ya ofrecen varias de ellas.

La ventaja competitiva debe construirse sobre la integración y los datos.

---

# 9. Diferenciación

La tesis de diferenciación de Tlaco es:

> **Tlaco entiende la operación completa del negocio porque cada interacción ocurre dentro del mismo ecosistema.**

Una venta genera información.

Una orden genera información.

Un producto genera información.

Un cliente genera información.

Un pago genera información.

Con suficiente historial, Tlaco puede empezar a entender cómo funciona el negocio.

---

# 10. Mi Dinero

Mi Dinero puede convertirse en uno de los componentes centrales del producto.

El dueño de un negocio debería poder responder rápidamente:

- ¿Cuánto vendí hoy?
- ¿Cuánto vendí esta semana?
- ¿Cuánto estoy ganando?
- ¿Cuánto estoy gastando?
- ¿Cuál es mi margen?
- ¿Cuánto dinero puedo retirar?
- ¿Qué productos generan más dinero?
- ¿Dónde estoy perdiendo dinero?

El objetivo es pasar de:

> registrar ventas

a:

> entender el negocio.

---

# 11. Inteligencia

Una evolución importante del producto sería convertir los datos operativos en recomendaciones.

No se trata de agregar IA únicamente porque sea una tendencia.

La inteligencia debe resolver problemas reales.

Ejemplos:

> Tus ventas bajaron 18% comparadas con el jueves anterior.

> Normalmente los martes necesitas 15 kg adicionales de determinado insumo.

> Este producto representa una parte importante de tus ventas pero tiene un margen bajo.

> Tu inventario actual probablemente será insuficiente para el fin de semana.

> Tus ventas aumentan significativamente entre 2 PM y 4 PM.

> Este producto lleva varios días sin venderse.

La evolución sería:

```text
Datos
  ↓
Información
  ↓
Predicción
  ↓
Recomendación
  ↓
Acción
```

---

# 12. Financiamiento

El financiamiento puede convertirse en una extensión natural de los datos operativos.

Si Tlaco conoce:

- Ventas
- Recurrencia
- Flujo
- Inventario
- Antigüedad
- Crecimiento

eventualmente puede construir modelos que ayuden a determinar la capacidad financiera de un negocio.

En lugar de presentar:

> Préstamos

la propuesta podría evolucionar hacia:

> **Capital para hacer crecer tu negocio.**

---

# 13. Marketplace de proveedores

Otra posible evolución es conectar negocios con proveedores.

Ejemplo:

Un restaurante necesita constantemente:

- Carne
- Verduras
- Tortillas
- Bebidas
- Desechables
- Gas
- Limpieza

Tlaco podría detectar necesidades basándose en inventario y ventas.

```text
Inventario
     ↓
Predicción
     ↓
Necesidad
     ↓
Proveedor
     ↓
Compra
     ↓
Financiamiento
```

Esto crea un ecosistema considerablemente más difícil de reemplazar que un POS tradicional.

---

# 14. Efecto red

Una plataforma se vuelve más valiosa cuando diferentes participantes interactúan dentro de ella.

Tlaco puede eventualmente conectar:

```text
Negocio
 ├── Empleados
 ├── Clientes
 ├── Contador
 ├── Proveedores
 ├── Sucursales
 └── Financiamiento
```

Mientras más relaciones dependan de Tlaco, mayor puede ser el costo de reemplazar la plataforma.

---

# 15. Estrategia inicial de mercado

No intentar vender inicialmente a todos los tipos de negocios.

Elegir un vertical donde Tlaco pueda resolver muchos problemas simultáneamente.

Ejemplo inicial:

## Taquerías / restaurantes pequeños

Necesitan:

- Caja
- Órdenes
- Productos
- Mesas
- QR
- Kiosco
- Cocina
- Inventario
- Pagos
- Reportes
- Sitio web

Esto permite validar gran parte del ecosistema.

Después se pueden desarrollar configuraciones específicas para otros verticales.

---

# 16. Estrategia de lanzamiento

En lugar de comunicar:

> Tlaco ya está terminado.

Utilizar inicialmente:

> **Programa de primeros negocios Tlaco.**

Objetivo inicial:

### 20–30 negocios reales.

No buscar miles inmediatamente.

Buscar negocios que permitan descubrir:

- Problemas
- Bugs
- Flujos innecesarios
- Funciones faltantes
- Disposición a pagar
- Frecuencia de uso
- Retención

La métrica inicial más importante no debería ser registros.

Debe ser:

> **Negocios que utilizan Tlaco todos los días.**

---

# 17. Visión

Tlaco puede evolucionar en diferentes etapas.

## Etapa 1 — Operación

```text
POS
Orders
Products
Inventory
QR
Tables
Kiosk
Website
```

## Etapa 2 — Administración

```text
Customers
Employees
Branches
Reports
Expenses
Cashflow
```

## Etapa 3 — Inteligencia

```text
Predictions
Recommendations
Alerts
Automation
```

## Etapa 4 — Finanzas

```text
Payments
Capital
Credit
Cashflow
```

## Etapa 5 — Ecosistema

```text
Suppliers
Marketplace
Accountants
Integrations
Financial services
```

---

# 18. North Star

La visión de largo plazo podría resumirse como:

> **Tlaco es la plataforma que entiende cómo funciona tu negocio y te ayuda a hacerlo crecer.**

---

# 19. Pregunta obligatoria para cada nueva funcionalidad

Antes de desarrollar cualquier nueva característica debemos responder:

> ¿Esto hace que un negocio venda más, opere mejor o tome mejores decisiones?

Si la respuesta es no, debemos cuestionar si realmente pertenece al producto.

---

# 20. Marco de análisis

Las decisiones importantes de Tlaco serán evaluadas desde seis perspectivas independientes.

## Investor

Archivo:

`01-investor.md`

Evalúa:

- Tamaño del mercado
- Modelo de negocio
- Unit economics
- Escalabilidad
- Moat
- Competencia
- Riesgos
- Retorno potencial
- Financiamiento
- Expansión

Pregunta principal:

> ¿Invertiría dinero en Tlaco?

---

## Customer

Archivo:

`02-customer.md`

Representa al dueño real del negocio.

Evalúa:

- Facilidad
- Utilidad
- Precio
- Problemas reales
- Tiempo ahorrado
- Valor percibido
- Onboarding
- Uso diario

Pregunta principal:

> ¿Pagaría por Tlaco todos los meses?

---

## Marketing

Archivo:

`03-marketing.md`

Evalúa:

- Posicionamiento
- Marca
- Mensaje
- Segmentación
- Adquisición
- Landing
- Contenido
- Campañas
- Diferenciación percibida

Pregunta principal:

> ¿Puedo explicar por qué Tlaco importa en menos de 10 segundos?

---

## Sales

Archivo:

`04-sales.md`

Evalúa:

- Cómo venderlo
- Objeciones
- Pricing
- Demo
- Ciclo de venta
- Conversión
- Upselling
- Retención
- Competidores

Pregunta principal:

> ¿Puedo convencer a un negocio de pagar por Tlaco?

---

## Product

Archivo:

`05-product.md`

Esta perspectiva representa Product Management.

Evalúa:

- Roadmap
- Prioridades
- UX
- Retención
- Activación
- Métricas
- Funcionalidades
- Product-market fit
- Verticales
- Experimentos

Pregunta principal:

> ¿Estamos construyendo lo correcto?

---

## Technology / CTO

Archivo:

`06-technology.md`

Evalúa:

- Arquitectura
- Escalabilidad
- Seguridad
- Multi-tenancy
- Performance
- Observabilidad
- Costos
- Deuda técnica
- Integraciones
- Disponibilidad

Pregunta principal:

> ¿Podemos soportar técnicamente el negocio que queremos construir?

---

# 21. Cómo tomaremos decisiones

Cada propuesta importante será evaluada por las seis perspectivas.

Ejemplo:

## Propuesta

> Agregar marketplace de proveedores.

### Investor

¿Aumenta el TAM?

¿Genera otra fuente de ingresos?

¿Crea un moat?

### Customer

¿Realmente lo utilizaría?

¿Me ahorra dinero o tiempo?

### Marketing

¿Nos ayuda a diferenciarnos?

### Sales

¿Ayuda a cerrar ventas?

¿Se puede vender como add-on?

### Product

¿Tiene suficiente valor frente al costo de construirlo?

### CTO

¿Qué complejidad introduce?

¿Qué infraestructura necesita?

---

# 22. Sistema de puntuación

Cada área asignará:

| Puntuación | Significado |
| ---------- | ----------- |
| 1          | Muy malo    |
| 2          | Malo        |
| 3          | Aceptable   |
| 4          | Bueno       |
| 5          | Excelente   |

Y entregará:

```text
Score: X/5

Strengths:
-

Weaknesses:
-

Risks:
-

Opportunities:
-

Recommendation:
GO / TEST / WAIT / NO-GO
```

---

# 23. Regla

No buscamos que las seis perspectivas estén de acuerdo.

Buscamos precisamente lo contrario.

Investor puede decir:

> Excelente oportunidad.

CTO puede decir:

> Extremadamente costoso.

Customer puede decir:

> No lo necesito.

Sales puede decir:

> Es muy fácil venderlo.

Product puede decir:

> Hagamos un experimento antes.

Ese conflicto es información útil.

---

# 24. Objetivo

Antes de invertir semanas o meses desarrollando una funcionalidad importante debemos poder responder:

```text
              TLACO DECISION

Investor      ★★★★☆
Customer      ★★★★★
Marketing     ★★★☆☆
Sales         ★★★★☆
Product       ★★★★☆
Technology    ★★☆☆☆

              ↓

           TEST FIRST
```

El objetivo no es desarrollar más funcionalidades.

El objetivo es construir las funcionalidades correctas.

---

# 25. Principio final

> **Tlaco no gana por tener más funcionalidades.**

Tlaco gana si consigue entender mejor al pequeño negocio que cualquier otra plataforma y convierte ese conocimiento en acciones que ayuden al negocio a vender más, operar mejor y crecer.
