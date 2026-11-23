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
            a: "Sí. Crear, editar, descargar y compartir tus anuncios es gratis, y cada negocio empieza con 5 Tlacos para imágenes con IA. La membresía te da Tlacos cada mes y te deja publicar en tu sitio.",
          },
          {
            q: "¿Cada cambio consume Tlacos?",
            a: `No. Editar textos, estilo, formato y foto, sugerir frases y descargar es gratis. ${aiEnabled ? "Solo una imagen nueva con IA usa Tlacos: 1 la normal y 3 la Premium, y ves el costo antes." : "La generación con IA no está habilitada en este momento."}`,
          },
          {
            q: "¿Studio cambia mis precios o promociones?",
            a: "El catálogo sigue siendo la fuente de verdad. Studio usa sus datos para componer el anuncio y vuelve a validar precio, estado y vigencia al distribuir.",
          },
          {
            q: "¿Qué pasa cuando vence?",
            a: "Sigues creando, editando y descargando. Conservas tu biblioteca, tus imágenes y los Tlacos que compraste. Publicar en tu sitio o mesas requiere reactivar.",
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
