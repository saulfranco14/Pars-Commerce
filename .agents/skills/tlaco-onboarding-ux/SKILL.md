---
name: tlaco-onboarding-ux
description: Diseña, implementa o revisa recorridos de adquisición, registro, preparación y primer uso de Tlaco. Úsala cuando se modifiquen pasos, formularios, validaciones, catálogos iniciales, activación del negocio, ayudas contextuales o membresías dentro del onboarding y sea necesario conservar datos, evitar saltos visuales y conducir al usuario directamente a la acción que desbloquea el avance.
---

# Onboarding de Tlaco

Diseñar para una persona dueña de negocio que abre Tlaco desde el teléfono, tiene poco tiempo y necesita publicar sin aprender primero el sistema.

## Antes de editar

1. Trazar el recorrido completo desde la entrada hasta la primera acción real.
2. Identificar datos ya capturados. No pedirlos nuevamente; precargarlos y permitir corregirlos.
3. Definir una sola decisión principal por pantalla.
4. Escribir el resultado práctico antes de diseñar el componente.

## Reglas de interfaz

- Mantener H1 concretos: resultado + contexto, máximo dos líneas en desktop y tres en móvil. Usar normalmente `text-3xl` como máximo en flujos.
- Reservar una altura estable para el contenido de pasos. El pie con Atrás/Continuar no debe saltar entre pasos.
- Mantener la acción principal abajo y accesible; en móvil usar pie sticky con fondo sólido y `safe-area`.
- No usar scroll interno largo si la persona necesita localizar un error. Si resulta inevitable, conservar referencias a las filas.
- Usar objetivos táctiles de al menos 44 px y evitar scroll horizontal involuntario.
- No cambiar tamaño, posición o texto esencial de controles equivalentes entre pasos.
- Explicar beneficios mediante acciones y resultados; evitar títulos abstractos o decorativos.

## Datos y validación

- Validar al escribir o al salir del campo cuando ya exista una función de validación compartida.
- Mostrar el error junto al campo y conservarlo visible para lectores de pantalla.
- Ante un error de lista, cambiar al paso correcto, hacer scroll y enfocar la fila exacta que lo causa.
- Identificar visualmente el elemento inválido; no obligar a buscarlo.
- Conservar teléfono, nombre, giro, catálogo y preferencias entre solución, registro, creación y preparación.
- No ejecutar acciones reales durante recorridos ilustrativos.

## Catálogo inicial

- Permitir tres entradas: plantilla del giro, captura rápida y creación desde fotografías.
- Al elegir fotos, crear borradores visibles con miniatura, nombre, precio y stock; no afirmar que una imagen fue interpretada si no existe procesamiento real.
- Subir la imagen después de crear el producto y asociarla al identificador real.
- Permitir corregir cada borrador antes de publicarlo.

## Membresías

- Presentarlas después de que la persona perciba valor o termine la preparación.
- Mostrar Gratis como decisión válida y predeterminada.
- Aclarar siempre: no es obligatorio, no se activa automáticamente y no requiere tarjeta para iniciar.
- Recomendar un plan por necesidad operativa, no mediante urgencia artificial.
- Permitir cerrar o posponer el modal sin bloquear el acceso al negocio.

## Revisión rápida

- Probar mentalmente 360 px antes de desktop.
- Verificar que todos los pasos ocupen una envolvente estable.
- Confirmar que ningún dato ya proporcionado reaparezca vacío.
- Forzar cada error y comprobar que el foco llegue al campo o producto correcto.
- Confirmar que cancelar una membresía o modal conserve el plan Gratis.
- Ejecutar validaciones técnicas sólo al cierre solicitado, no durante cada ajuste visual.
