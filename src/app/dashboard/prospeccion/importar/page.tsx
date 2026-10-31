"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { ImportView } from "@/features/growth/components/admin/ImportView";

export default function ImportarPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader eyebrow="Prospección" title="Importar negocios" description="Trae más negocios a la lista desde el DENUE del INEGI o desde tu propia lista. Nada se duplica." />
      <ImportView />
    </div>
  );
}
