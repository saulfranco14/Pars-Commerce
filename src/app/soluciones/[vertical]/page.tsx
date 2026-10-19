import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FocusedSolutionExperience } from "@/features/solutions/components/FocusedSolutionExperience";
import { SOLUTIONS, getSolutionByVertical } from "@/features/solutions/solutionCatalog";

export function generateStaticParams() {
  return SOLUTIONS.map((solution) => ({ vertical: solution.path }));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const solution = getSolutionByVertical((await params).vertical);
  if (!solution) return {};
  const title = `${solution.eyebrow} | Catálogo, pedidos y cobros`;
  const description = `${solution.problem} Con Tlaco conectas tu tienda, pedidos y caja desde un solo lugar.`;
  return {
    title,
    description,
    alternates: { canonical: `/soluciones/${solution.path}` },
    openGraph: { title, description, images: [{ url: solution.heroImage, width: 1448, height: 1086, alt: solution.eyebrow }] },
  };
}

export default async function SolutionPage({ params, searchParams }: { params: Promise<{ vertical: string }>; searchParams: Promise<{ iniciar?: string }> }) {
  const solution = getSolutionByVertical((await params).vertical);
  if (!solution) notFound();
  const query = await searchParams;
  return <FocusedSolutionExperience solution={solution} startOnboarding={query.iniciar === "1"} />;
}
