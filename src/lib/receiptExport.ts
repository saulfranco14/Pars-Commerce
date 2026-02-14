import { toBlob } from "html-to-image";

export async function captureReceiptAsPng(
  element: HTMLElement
): Promise<Blob> {
  const blob = await toBlob(element, {
    type: "image/png",
    backgroundColor: "#ffffff",
    cacheBust: true,
  });
  if (!blob) throw new Error("Failed to capture receipt");
  return blob;
}

export function downloadReceiptBlob(blob: Blob, orderId: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recibo-${orderId}.png`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportReceiptAsPng(
  element: HTMLElement,
  orderId: string
): Promise<void> {
  const blob = await captureReceiptAsPng(element);
  downloadReceiptBlob(blob, orderId);
}
