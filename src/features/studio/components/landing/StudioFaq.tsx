export function StudioFaq({
  publishEnabled = false,
  aiEnabled = false,
}: {
  publishEnabled?: boolean;
  aiEnabled?: boolean;
}) {
  return (
    <section
      id="preguntas"
      className="mx-auto max-w-3xl scroll-mt-24 px-5 py-14 sm:px-6"
    >
      <h2 className="text-2xl font-bold tracking-tight">
        Antes de crear tu primer diseño.
      </h2>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {[
          {
            q: "¿Puedo entrar sin membresía?",
            a: "Sí. Puedes explorar las herramientas y ejemplos. Iniciar un diseño propio requiere una membresía Studio vigente para tu negocio.",
          },
          {
            q: "¿Cada cambio consume Tlacos?",
            a: `No. Editar texto, tamaño, composición y fotografía, usar plantillas y exportar consume 0 Tlacos. ${aiEnabled ? "Una nueva generación con IA requiere saldo y confirmación del costo." : "La generación con IA no está habilitada en este momento."}`,
          },
          {
            q: "¿Studio cambia mis precios o promociones?",
            a: "El catálogo sigue siendo la fuente de verdad. Studio usa sus datos para componer el anuncio y vuelve a validar precio, estado y vigencia al distribuir.",
          },
          {
            q: "¿Qué pasa cuando vence?",
            a: "Conservas biblioteca, descargas, recargas y publicaciones que sigan siendo elegibles. Crear, editar y generar de nuevo requiere reactivar Studio.",
          },
          {
            q: "¿Publica automáticamente en Instagram o Facebook?",
            a: "Descargas el archivo o utilizas la opción de compartir de tu dispositivo. Debes completar la publicación en la aplicación elegida; abrir el selector no confirma una publicación.",
          },
          {
            q: "¿Puedo aplicarlo en mi sitio o mesas?",
            a: publishEnabled
              ? "Puedes elegir superficies compatibles y su vigencia, con permiso de publicación. El anuncio respeta los datos y canales de tu catálogo."
              : "La publicación interna no está habilitada en este momento. Puedes descargar el archivo y compartirlo por los canales que elijas.",
          },
          {
            q: "¿Mis fotos se vuelven públicas?",
            a: "Los archivos de trabajo son privados. Solo el arte que elijas aplicar se entrega públicamente en las superficies autorizadas. El análisis o generación con IA requiere enviar la imagen al proveedor configurado.",
          },
        ].map((item) => (
          <details key={item.q} className="p-5">
            <summary className="cursor-pointer text-sm font-bold">
              {item.q}
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
