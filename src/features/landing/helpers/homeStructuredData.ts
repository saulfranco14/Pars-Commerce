/** schema.org graph for the home page; serialized into a JSON-LD script tag. */
export function homeStructuredData(
  base: string,
  description: string,
  faqs: ReadonlyArray<{ question: string; answer: string }>,
) {
  const organization = `${base}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organization,
        name: "Tlaco",
        url: base,
        logo: `${base}/icon.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "Tlaco",
        url: base,
        inLanguage: "es-MX",
        publisher: { "@id": organization },
      },
      {
        "@type": "SoftwareApplication",
        name: "Tlaco",
        url: base,
        description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "es-MX",
        offers: { "@type": "Offer", price: 0, priceCurrency: "MXN" },
        publisher: { "@id": organization },
      },
      {
        "@type": "FAQPage",
        "@id": `${base}/#preguntas`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}
