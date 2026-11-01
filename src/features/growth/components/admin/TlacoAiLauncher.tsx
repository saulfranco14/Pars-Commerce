"use client";

import { useState } from "react";

import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { TlacoAiFab } from "@/features/growth/components/admin/TlacoAiFab";
import { TlacoAiSheet } from "@/features/growth/components/admin/TlacoAiSheet";

import type { TlacoAiTopic } from "@/features/growth/interfaces/tlacoAi";

const noop = () => undefined;

/** Tlaco IA always at hand on the lead page, where the worker is talking to the business: it opens on «Para activar». */
export function TlacoAiLauncher() {
  const { actor } = useGrowthMe();
  const [topic, setTopic] = useState<TlacoAiTopic | null>(null);
  if (!actor || actor.tenantId) return null;

  return (
    <>
      <TlacoAiFab visible={topic === null} teaser="¿Te preguntó algo? Pregúntame" onOpen={() => setTopic("activar")} />
      <TlacoAiSheet
        isOpen={topic !== null}
        isTlaco
        withToday={false}
        topic={topic ?? "activar"}
        onTopic={setTopic}
        onClose={() => setTopic(null)}
        plan={null}
        text={null}
        writing={false}
        onAgain={noop}
        onStep={noop}
      />
    </>
  );
}
