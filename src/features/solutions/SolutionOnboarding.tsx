"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Link2,
  PackageCheck,
  WalletCards,
  X,
} from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import {
  registrationIntentQuery,
  type CatalogStartMode,
  type RegistrationIntent,
} from "@/features/auth/registrationIntent";
import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";

const THEME_CHOICES = [
  { key: "tlaco", label: "Tlaco", color: "#3483fa" },
  { key: "ink", label: "Tinta", color: "#18243a" },
  { key: "terracotta", label: "Terracota", color: "#b45309" },
] as const;

const GOALS = [
  { id: "sell", title: "Vender por enlace", text: "Comparte tienda y promociones por WhatsApp o QR.", icon: Link2 },
  { id: "orders", title: "Organizar pedidos", text: "Recibe, prepara y entrega desde una sola cola.", icon: ClipboardCheck },
  { id: "cash", title: "Cobrar con claridad", text: "Conecta pedido, pago, ticket y cierre.", icon: WalletCards },
  { id: "stock", title: "Controlar productos", text: "Conoce qué vendiste y qué queda disponible.", icon: PackageCheck },
] as const;

const CATALOG_MODES: Array<{
  id: CatalogStartMode;
  title: string;
  text: string;
  recommended?: boolean;
}> = [
  { id: "starter", title: "Usar catálogo inicial", text: "Tlaco carga una base de tu giro; tú ocultas o corriges únicamente las diferencias.", recommended: true },
  { id: "own", title: "Agregar mis productos", text: "Empieza con una lista limpia y captura primero lo que más vendes." },
  { id: "assisted", title: "Quiero ayuda de Tlaco", text: "Comparte la información que ya tienes y te ayudamos a prepararla." },
];

function measure(step: number, solution: string) {
  try {
    track("solution_onboarding_step", { solution, step });
  } catch {
    // La analítica no bloquea el avance.
  }
}

function Dots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Paso ${current + 1} de 4`}>
      {[0, 1, 2, 3].map((index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === current ? "w-7 bg-[#172033]" : "w-1.5 bg-[#cbd2dc]"}`} />)}
    </div>
  );
}

export function SolutionOnboarding({
  solution,
  name,
  setName,
  selectedTheme,
  setSelectedTheme,
  onClose,
}: {
  solution: SolutionDefinition;
  name: string;
  setName: (value: string) => void;
  selectedTheme: number;
  setSelectedTheme: (value: number) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>(["sell"]);
  const [catalogMode, setCatalogMode] = useState<CatalogStartMode>("starter");

  function toggleGoal(goal: string) {
    setGoals((current) => {
      if (current.includes(goal)) return current.filter((item) => item !== goal);
      if (current.length >= 2) return [current[1], goal];
      return [...current, goal];
    });
  }

  function continueFlow() {
    if (step < 2) {
      measure(step + 1, solution.path);
      setStep((current) => current + 1);
      return;
    }
    const intent: RegistrationIntent = {
      plan: "free",
      giro: solution.catalog.businessType,
      solutionKey: solution.path,
      catalogKey: solution.catalog.key,
      businessName: name.trim() || solution.preset.defaultName,
      themeKey: THEME_CHOICES[selectedTheme].key,
      primaryGoals: goals,
      catalogStartMode: catalogMode,
      onboardingSessionId: `${solution.path}-${Date.now().toString(36)}`,
      assisted: catalogMode === "assisted",
    };
    try {
      track("solution_registration_started", { solution: solution.path, catalog_mode: catalogMode });
    } catch {
      // La navegación continúa aunque la medición falle.
    }
    router.push(`/registro?${registrationIntentQuery(intent)}`);
  }

  return (
    <div className="solution-onboarding-flow fixed inset-0 z-[80] overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-labelledby="solution-onboarding-title">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between"><TlacoLogo size="md" /><button type="button" onClick={onClose} aria-label="Cerrar preparación" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#dfe3e8] text-[#596273] hover:bg-[#f5f6f8]"><X className="h-5 w-5" /></button></div>

        <div className="flex flex-1 items-center py-8 sm:py-12">
          <div className="mx-auto w-full max-w-3xl">
            {step === 0 ? <div><p className="text-sm font-semibold text-[#6b7280]">Hagámoslo tuyo</p><h1 id="solution-onboarding-title" className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">¿Cómo se llama tu negocio?</h1><p className="mt-3 text-base text-[#687181] sm:text-lg">Lo verás aplicado en la tienda, los pedidos y el ticket.</p><label htmlFor="business-name" className="mt-9 block text-sm font-semibold">Nombre del negocio</label><input id="business-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoFocus className="mt-2 min-h-14 w-full rounded-2xl border border-[#ccd3dd] bg-[#f8f9fb] px-4 text-lg font-semibold outline-none focus:border-[#3483fa] focus:ring-4 focus:ring-[#3483fa]/10" placeholder={solution.preset.defaultName} /><fieldset className="mt-7"><legend className="text-sm font-semibold">Elige una apariencia</legend><div className="mt-3 grid grid-cols-3 gap-3">{THEME_CHOICES.map((theme, index) => <button key={theme.key} type="button" onClick={() => setSelectedTheme(index)} aria-pressed={selectedTheme === index} className={`min-h-20 rounded-2xl border p-3 text-left ${selectedTheme === index ? "border-[#172033] ring-1 ring-[#172033]" : "border-[#dfe3e8]"}`}><span className="block h-6 w-6 rounded-full" style={{ background: theme.color }} /><span className="mt-2 block text-sm font-semibold">{theme.label}</span></button>)}</div></fieldset></div> : null}

            {step === 1 ? <div><p className="text-sm font-semibold text-[#6b7280]">Elige hasta dos</p><h1 id="solution-onboarding-title" className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">¿Qué quieres resolver primero?</h1><p className="mt-3 text-base text-[#687181] sm:text-lg">Tu inicio mostrará primero las acciones que sí necesitas.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{GOALS.map(({ id, title, text, icon: Icon }) => { const selected = goals.includes(id); return <button key={id} type="button" onClick={() => toggleGoal(id)} aria-pressed={selected} className={`flex min-h-28 items-start gap-4 rounded-2xl border p-5 text-left ${selected ? "border-[#172033] ring-1 ring-[#172033]" : "border-[#dfe3e8]"}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-[#172033] text-white" : "bg-[#f1f4f8] text-[#596273]"}`}><Icon className="h-5 w-5" /></span><span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm leading-5 text-[#687181]">{text}</span></span></button>; })}</div></div> : null}

            {step === 2 ? <div><p className="text-sm font-semibold text-[#6b7280]">Tu catálogo</p><h1 id="solution-onboarding-title" className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">¿Cómo quieres comenzar?</h1><p className="mt-3 text-base text-[#687181] sm:text-lg">Podrás cambiarlo todo después; esto sólo evita empezar desde cero.</p><div className="mt-8 space-y-3">{CATALOG_MODES.map((mode) => { const selected = catalogMode === mode.id; return <button key={mode.id} type="button" onClick={() => setCatalogMode(mode.id)} aria-pressed={selected} className={`flex min-h-24 w-full items-center gap-4 rounded-2xl border p-5 text-left ${selected ? "border-[#172033] ring-1 ring-[#172033]" : "border-[#dfe3e8]"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#172033] bg-[#172033] text-white" : "border-[#cbd2dc]"}`}>{selected ? <Check className="h-4 w-4" /> : null}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 font-semibold">{mode.title}{mode.recommended ? <span className="rounded-full bg-[#e9f8f0] px-2 py-0.5 text-[11px] font-bold text-[#087443]">RECOMENDADO</span> : null}</span><span className="mt-1 block text-sm leading-5 text-[#687181]">{mode.text}</span></span></button>; })}</div></div> : null}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 border-t border-[#eceef1] pt-5"><button type="button" onClick={() => step === 0 ? onClose() : setStep((current) => current - 1)} className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#4f5868] hover:bg-[#f5f6f8]"><ArrowLeft className="h-4 w-4" />{step === 0 ? "Volver" : "Anterior"}</button><Dots current={step} /><button type="button" onClick={continueFlow} disabled={step === 0 && !name.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#111318] px-5 text-sm font-semibold text-white disabled:opacity-40">{step === 2 ? "Continuar al registro" : "Continuar"}<ArrowRight className="h-4 w-4" /></button></div>
      </div>
    </div>
  );
}
