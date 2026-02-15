import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConfirmacionPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/sitio/${slug}/inicio`);
}
