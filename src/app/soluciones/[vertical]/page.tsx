import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { studioFlags } from "@/features/studio/services/studioFlags";
import { FocusedSolutionExperience } from "@/features/solutions/components/FocusedSolutionExperience";
import {
  SOLUTIONS,
  getSolutionByVertical,
} from "@/features/solutions/solutionCatalog";
import { SOLUTION_SEO } from "@/features/solutions/constants/solutionSeo";
import { solutionStructuredData } from "@/features/solutions/helpers/solutionStructuredData";
import { getPublicAppUrl } from "@/lib/env/appUrl";

export function generateStaticParams() {
  return SOLUTIONS.map((solution) => ({ vertical: solution.path }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const solution = getSolutionByVertical((await params).vertical);
  if (!solution) return {};
  const { title, description } = SOLUTION_SEO[solution.path];
  return {
    title,
    description,
    alternates: { canonical: `/soluciones/${solution.path}` },
    openGraph: {
      title,
      description,
      url: `/soluciones/${solution.path}`,
      locale: "es_MX",
      siteName: "Tlaco",
      type: "website",
      images: [
        {
          url: solution.heroImage,
          width: 1448,
          height: 1086,
          alt: solution.eyebrow,
        },
      ],
    },
  };
}

export default async function SolutionPage({
  params,
  searchParams,
}: {
  params: Promise<{ vertical: string }>;
  searchParams: Promise<{ iniciar?: string }>;
}) {
  const solution = getSolutionByVertical((await params).vertical);
  if (!solution) notFound();
  const query = await searchParams;
  const structured = solutionStructuredData(
    getPublicAppUrl(),
    solution.path,
    solution.eyebrow,
    SOLUTION_SEO[solution.path],
  );
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}
      />
      <FocusedSolutionExperience
        solution={solution}
        startOnboarding={query.iniciar === "1"}
        studioEnabled={studioFlags().public}
      />
    </>
  );
}
