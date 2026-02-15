"use client";

import { Check } from "lucide-react";
import type { SitePageContent } from "@/types/tenantSitePages";
import { FormSection, inputClass, btnPrimary } from "./SiteContentFormSection";

interface Props {
  content: SitePageContent;
  onChange: (c: SitePageContent) => void;
  onSave: () => void;
  loading: boolean;
}

export function SiteContentContactoTab({ content, onChange, onSave, loading }: Props) {
  return (
    <div className="space-y-8">
      <FormSection
        title="Datos de contacto"
        description="Información que aparece en la página /contacto. Los clientes la verán para ubicarte o escribirte."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="contacto-email" className="block text-sm font-medium text-muted-foreground">
              Correo electrónico
            </label>
            <input
              id="contacto-email"
              type="email"
              value={content.email ?? ""}
              onChange={(e) => onChange({ ...content, email: e.target.value })}
              className={inputClass}
              placeholder="contacto@mitienda.com"
            />
          </div>
          <div>
            <label htmlFor="contacto-phone" className="block text-sm font-medium text-muted-foreground">
              Teléfono
            </label>
            <input
              id="contacto-phone"
              type="tel"
              value={content.phone ?? ""}
              onChange={(e) => onChange({ ...content, phone: e.target.value })}
              className={inputClass}
              placeholder="555-0000 o 5215512345678"
            />
          </div>
          <div>
            <label htmlFor="contacto-address" className="block text-sm font-medium text-muted-foreground">
              Dirección
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dirección física o punto de entrega.
            </p>
            <input
              id="contacto-address"
              type="text"
              value={content.address_text ?? ""}
              onChange={(e) => onChange({ ...content, address_text: e.target.value })}
              maxLength={200}
              className={inputClass}
              placeholder="Av. Principal 123, Col. Centro, CDMX"
            />
          </div>
          <div>
            <label htmlFor="contacto-schedule" className="block text-sm font-medium text-muted-foreground">
              Horario de atención
            </label>
            <input
              id="contacto-schedule"
              type="text"
              value={content.schedule ?? ""}
              onChange={(e) => onChange({ ...content, schedule: e.target.value })}
              maxLength={100}
              className={inputClass}
              placeholder="Lun–Vie 9:00–18:00, Sáb 10:00–14:00"
            />
          </div>
          <div>
            <label htmlFor="contacto-welcome" className="block text-sm font-medium text-muted-foreground">
              Mensaje de bienvenida
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Texto que aparece arriba de los datos de contacto.
            </p>
            <textarea
              id="contacto-welcome"
              value={content.welcome_message ?? ""}
              onChange={(e) => onChange({ ...content, welcome_message: e.target.value })}
              maxLength={300}
              rows={2}
              className={inputClass}
              placeholder="Ej. Escríbenos, te responderemos pronto."
            />
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className={btnPrimary}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {loading ? "Guardando…" : "Guardar Contacto"}
        </button>
      </div>
    </div>
  );
}
