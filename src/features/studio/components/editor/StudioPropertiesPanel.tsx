"use client";
import { FormInput } from "@/components/ui/FormInput";
import { LockKeyhole } from "lucide-react";
import { STUDIO_FONTS } from "../../constants/studio";
import { StudioOptions } from "../StudioOptions";
import type { StudioPropertiesProps } from "../../interfaces/ui";

export function StudioPropertiesPanel({
  node,
  readOnly,
  onChange,
}: StudioPropertiesProps) {
  if (!node)
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        Selecciona una capa en el lienzo o en la lista para cambiar sus
        propiedades.
      </p>
    );
  const update = (patch: Parameters<typeof onChange>[1]) =>
    onChange(node.id, patch);
  const text = ["text", "price", "qr"].includes(node.kind);
  return (
    <fieldset disabled={readOnly || node.locked} className="space-y-4">
      <legend className="mb-3 text-sm font-bold">Propiedades de la capa</legend>
      {node.binding && (
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          El contenido viene del catálogo. Aquí ajustas su presentación.
        </p>
      )}
      {text && (
        <FormInput
          label={
            node.kind === "price" ? "Precio del catálogo" : "Texto / enlace"
          }
          value={node.content}
          disabled={Boolean(node.binding) || readOnly || node.locked}
          onChange={(e) => update({ content: e.target.value })}
        />
      )}
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { label: "Posición X (%)", key: "x" },
            { label: "Posición Y (%)", key: "y" },
            { label: "Ancho (%)", key: "width" },
            { label: "Alto (%)", key: "height" },
          ] as const
        ).map((field) => (
          <FormInput
            key={field.key}
            label={field.label}
            type="number"
            min={field.key === "x" || field.key === "y" ? -100 : 1}
            max={200}
            step={1}
            value={Math.round(node[field.key] * 100)}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isFinite(n)) update({ [field.key]: n / 100 });
            }}
          />
        ))}
      </div>
      {text && node.kind !== "qr" && (
        <>
          <FormInput
            label="Tamaño del texto (%)"
            type="number"
            min={1}
            max={50}
            step={0.5}
            value={Number((node.fontSize * 100).toFixed(1))}
            onChange={(e) => {
              if (Number.isFinite(e.target.valueAsNumber))
                update({ fontSize: e.target.valueAsNumber / 100 });
            }}
          />
          <StudioOptions
            label="Tipografía"
            value={node.fontFamily}
            options={STUDIO_FONTS.map((font) => ({ value: font, label: font }))}
            onChange={(fontFamily) => update({ fontFamily })}
          />
          <StudioOptions
            label="Peso"
            value={node.fontStyle}
            options={[
              { value: "normal", label: "Normal" },
              { value: "bold", label: "Negrita" },
              { value: "italic", label: "Cursiva" },
            ]}
            onChange={(fontStyle) => update({ fontStyle })}
          />
          <StudioOptions
            label="Alineación"
            value={node.align}
            options={[
              { value: "left", label: "Izquierda" },
              { value: "center", label: "Centro" },
              { value: "right", label: "Derecha" },
            ]}
            onChange={(align) => update({ align })}
          />
          <FormInput
            label="Interlineado"
            type="number"
            min={0.5}
            max={3}
            step={0.1}
            value={node.lineHeight}
            onChange={(e) => {
              if (Number.isFinite(e.target.valueAsNumber))
                update({ lineHeight: e.target.valueAsNumber });
            }}
          />
        </>
      )}
      <FormInput
        label={node.kind === "shape" ? "Color de relleno" : "Color"}
        type="color"
        value={node.kind === "shape" ? node.fill : node.color}
        onChange={(e) =>
          update(
            node.kind === "shape"
              ? { fill: e.target.value }
              : { color: e.target.value },
          )
        }
      />
      <FormInput
        label="Opacidad (%)"
        type="range"
        min={10}
        max={100}
        value={node.opacity * 100}
        onChange={(e) => update({ opacity: e.target.valueAsNumber / 100 })}
      />
      {text && node.kind !== "qr" && (
        <>
          <FormInput
            label="Color del contorno"
            type="color"
            value={node.stroke}
            onChange={(e) => update({ stroke: e.target.value })}
          />
          <FormInput
            label="Grosor del contorno"
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={node.strokeWidth}
            onChange={(e) => update({ strokeWidth: e.target.valueAsNumber })}
          />
          <FormInput
            label="Color de sombra"
            type="color"
            value={node.shadowColor ?? "#000000"}
            onChange={(e) => update({ shadowColor: e.target.value })}
          />
          <FormInput
            label="Sombra"
            type="range"
            min={0}
            max={40}
            step={1}
            value={node.shadowBlur ?? 0}
            onChange={(e) => update({ shadowBlur: e.target.valueAsNumber })}
          />
        </>
      )}
      {
        <FormInput
          label="Rotación (grados)"
          type="number"
          min={-360}
          max={360}
          value={Math.round(node.rotation)}
          onChange={(e) => {
            if (Number.isFinite(e.target.valueAsNumber))
              update({ rotation: e.target.valueAsNumber });
          }}
        />
      }
      {node.kind === "image" && (
        <>
          <FormInput
            label="Zoom de la fotografía"
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={node.cropScale}
            onChange={(e) => update({ cropScale: e.target.valueAsNumber })}
          />
          <FormInput
            label="Reencuadre horizontal"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={node.cropX}
            onChange={(e) => update({ cropX: e.target.valueAsNumber })}
          />
          <FormInput
            label="Reencuadre vertical"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={node.cropY}
            onChange={(e) => update({ cropY: e.target.valueAsNumber })}
          />
        </>
      )}
    </fieldset>
  );
}
