"use client";
import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as CanvasImage,
  Transformer,
  Line,
  Group,
} from "react-konva";
import Konva from "konva";
import QRCode from "qrcode";
import { STUDIO_FORMATS } from "../../constants/studio";
import {
  loadStudioFonts,
  loadStudioImage,
  studioCornerRadius,
  studioImageCrop,
  studioImageUrl,
  studioShapeFill,
  studioTextProps,
} from "../../helpers/canvas";
import type { StudioImageSource } from "../../helpers/canvas";
import type {
  StudioCanvasProps,
  StudioCanvasNodeProps,
} from "../../interfaces/ui";

function CanvasNode({
  node: n,
  width,
  height,
  renderScale,
  url,
  readOnly,
  onSelect,
  onChange,
  onEdit,
}: StudioCanvasNodeProps) {
  const [image, setImage] = useState<StudioImageSource | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const task =
      n.kind === "qr" && n.content
        ? QRCode.toDataURL(n.content || "https://tlaco.app", {
            width: 512,
            margin: 1,
          }).then(loadStudioImage)
        : url
          ? loadStudioImage(url, n.kind === "image")
          : Promise.resolve(null);
    task
      .then((value) => {
        if (!cancelled) {
          setImage(value);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url, n.kind, n.content]);
  if (!n.visible) return null;
  const base = {
    id: n.id,
    x: n.x * width,
    y: n.y * height,
    width: n.width * width,
    height: n.height * height,
    rotation: n.rotation,
    opacity: n.opacity,
    shadowColor: n.shadowColor ?? "#000000",
    shadowBlur: (n.shadowBlur ?? 0) * renderScale,
    shadowOffsetX: (n.shadowOffsetX ?? 0) * renderScale,
    shadowOffsetY: (n.shadowOffsetY ?? 0) * renderScale,
    draggable: !readOnly && !n.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: onEdit,
    onDblTap: onEdit,
    onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
      const target = event.target;
      target.x(Math.round(target.x() / (width / 40)) * (width / 40));
      target.y(Math.round(target.y() / (height / 40)) * (height / 40));
    },
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) =>
      onChange({ x: event.target.x() / width, y: event.target.y() / height }),
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      const target = event.target;
      onChange({
        x: target.x() / width,
        y: target.y() / height,
        width: Math.max(0.01, (target.width() * target.scaleX()) / width),
        height: Math.max(0.01, (target.height() * target.scaleY()) / height),
        rotation: target.rotation(),
        ...(["text", "price"].includes(n.kind)
          ? {
              fontSize: Math.max(
                0.005,
                Math.min(0.5, n.fontSize * target.scaleY()),
              ),
            }
          : {}),
      });
      target.scaleX(1);
      target.scaleY(1);
    },
  };
  if (["logo", "qr"].includes(n.kind) && image) {
    const fit = Math.min(base.width / image.width, base.height / image.height),
      imageWidth = image.width * fit,
      imageHeight = image.height * fit;
    return (
      <Group {...base}>
        <Rect width={base.width} height={base.height} fill="transparent" />
        <CanvasImage
          image={image}
          x={(base.width - imageWidth) / 2}
          y={(base.height - imageHeight) / 2}
          width={imageWidth}
          height={imageHeight}
        />
      </Group>
    );
  }
  if (["image", "logo", "qr"].includes(n.kind))
    return image ? (
      <CanvasImage
        {...base}
        image={image}
        cornerRadius={studioCornerRadius(n, base.width, base.height)}
        crop={
          n.kind === "qr"
            ? undefined
            : studioImageCrop(
                { ...n, width: n.width * width, height: n.height * height },
                image,
              )
        }
      />
    ) : (
      <Rect
        {...base}
        fill={failed ? "#fee2e2" : "#e2e8f0"}
        stroke="#94a3b8"
        dash={[5, 5]}
      />
    );
  if (n.kind === "shape")
    return (
      <Rect
        {...base}
        {...studioShapeFill(n, base.width, base.height, renderScale)}
      />
    );
  return <Text {...base} {...studioTextProps(n, height, renderScale)} />;
}

export default function StudioCanvas({
  scene,
  selectedId,
  assets,
  tenantId,
  readOnly,
  onSelect,
  onChange,
  preview = false,
}: StudioCanvasProps) {
  const container = useRef<HTMLDivElement>(null),
    stage = useRef<Konva.Stage>(null),
    transformer = useRef<Konva.Transformer>(null);
  const [width, setWidth] = useState(320),
    [fontsReady, setFontsReady] = useState(false),
    [editing, setEditing] = useState<{ id: string; value: string } | null>(
      null,
    );
  const size = STUDIO_FORMATS[scene.format],
    height = (width * size.height) / size.width,
    selected = scene.nodes.find((n) => n.id === selectedId);
  useEffect(() => {
    let active = true;
    void loadStudioFonts().then(() => active && setFontsReady(true));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(
        Math.min(760, Math.max(preview ? 40 : 200, entry.contentRect.width)),
      ),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [preview]);
  useEffect(() => {
    const node = selectedId ? stage.current?.findOne(`#${selectedId}`) : null;
    transformer.current?.nodes(
      node && !readOnly && !selected?.locked ? [node] : [],
    );
  }, [selectedId, readOnly, selected?.locked, scene]);
  function commitText() {
    if (editing) {
      onChange(editing.id, { content: editing.value });
      setEditing(null);
    }
  }
  return (
    <div
      ref={container}
      className="w-full"
      role={preview ? undefined : "region"}
      aria-hidden={preview || undefined}
      aria-label={
        preview
          ? undefined
          : "Lienzo del anuncio. Usa el panel de capas y propiedades para editar con teclado."
      }
    >
      <div
        className="relative mx-auto overflow-hidden rounded-lg border border-border shadow-sm"
        style={{ width, height }}
      >
        <Stage
          ref={stage}
          listening={!preview}
          width={width}
          height={height}
          onMouseDown={(e) => {
            if (
              e.target === e.target.getStage() ||
              e.target.name() === "canvas-background"
            )
              onSelect(null);
          }}
          onTouchStart={(e) => {
            if (e.target.name() === "canvas-background") onSelect(null);
          }}
        >
          <Layer key={fontsReady ? "fonts" : "fallback"}>
            <Rect
              name="canvas-background"
              width={width}
              height={height}
              fill={scene.background}
            />
            {scene.nodes.map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                width={width}
                height={height}
                renderScale={height / size.height}
                url={studioImageUrl(node, assets, tenantId)}
                readOnly={readOnly}
                onSelect={() => onSelect(node.id)}
                onChange={(patch) => onChange(node.id, patch)}
                onEdit={() => {
                  if (
                    !readOnly &&
                    !node.binding &&
                    ["text", "price"].includes(node.kind)
                  )
                    setEditing({ id: node.id, value: node.content });
                }}
              />
            ))}
            {!preview && (
              <Rect
                x={width * 0.04}
                y={height * 0.04}
                width={width * 0.92}
                height={height * 0.92}
                stroke="#3483fa"
                strokeWidth={1}
                dash={[4, 4]}
                opacity={0.4}
                listening={false}
              />
            )}
            {selectedId && (
              <>
                <Line
                  points={[width / 2, 0, width / 2, height]}
                  stroke="#3483fa"
                  opacity={0.2}
                  listening={false}
                />
                <Line
                  points={[0, height / 2, width, height / 2]}
                  stroke="#3483fa"
                  opacity={0.2}
                  listening={false}
                />
              </>
            )}
            <Transformer
              ref={transformer}
              flipEnabled={false}
              rotateEnabled
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 12 || newBox.height < 12 ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
        {editing && (
          <textarea
            autoFocus
            aria-label="Editar texto en el lienzo"
            value={editing.value}
            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(null);
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) commitText();
            }}
            className="absolute z-10 rounded border-2 border-accent bg-white p-1 text-black"
            style={{
              left: (selected?.x ?? 0) * width,
              top: (selected?.y ?? 0) * height,
              width: (selected?.width ?? 0.8) * width,
              minHeight: 48,
              fontSize: (selected?.fontSize ?? 0.04) * height,
            }}
          />
        )}
      </div>
    </div>
  );
}
