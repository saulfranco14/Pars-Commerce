import type { SolutionSeo } from "@/features/solutions/interfaces/solutionSeo";

/** Breadcrumb (Tlaco › Soluciones › giro) plus the page itself, as schema.org JSON-LD. */
export function solutionStructuredData(
  base: string,
  path: string,
  name: string,
  seo: SolutionSeo,
) {
  const url = `${base}/soluciones/${path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: seo.title,
        description: seo.description,
        inLanguage: "es-MX",
        isPartOf: { "@id": `${base}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Tlaco", item: base },
          { "@type": "ListItem", position: 2, name: "Soluciones", item: `${base}/soluciones` },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
    ],
  };
}
