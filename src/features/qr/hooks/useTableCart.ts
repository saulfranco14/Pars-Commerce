"use client";

import { useEffect, useMemo, useState } from "react";

import { planPromotionGroup } from "@/lib/offers/groupPricing";
import { priceOrder } from "@/lib/offers/orderPricing";
import { sendItems } from "@/features/qr/services/tableClientService";

import type { CartEntry, MenuItem } from "@/features/qr/interfaces/tableCart";
import type { QrPromotion } from "@/features/qr/interfaces/promotion";

interface CartIntent {
  id: string;
  productId: string;
  quantity: number;
  promotionId: string | null;
  offerGroupId: string | null;
}

interface UseTableCartParams {
  menu: MenuItem[];
  promotions: QrPromotion[];
  qrToken: string;
  fingerprint: string;
  displayName: string | null;
  customerPhone?: string | null;
}

export interface UseTableCartResult {
  entries: CartEntry[];
  total: number;
  listTotal: number;
  savings: number;
  itemCount: number;
  quantitiesByProduct: Record<string, number>;
  customerNote: string;
  saving: boolean;
  error: string | null;
  confirmation: boolean;
  setCustomerNote: (note: string) => void;
  add: (productId: string) => void;
  addMany: (productId: string, qty: number) => void;
  addPromotion: (promotion: QrPromotion) => void;
  decrement: (productId: string) => void;
  remove: (entryId: string) => void;
  send: () => Promise<boolean>;
  dismissConfirmation: () => void;
}

export function useTableCart({
  menu,
  promotions,
  qrToken,
  fingerprint,
  displayName,
  customerPhone = null,
}: UseTableCartParams): UseTableCartResult {
  const [intents, setIntents] = useState<CartIntent[]>([]);
  const [customerNote, setCustomerNoteState] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmation]);

  const pricing = useMemo(() => priceOrder({
    products: menu.map((product) => ({ id: product.id, price: Number(product.price), subcatalog_id: product.subcatalog_id ?? null })),
    promotions,
    intents: intents.map((intent) => ({
      productId: intent.productId,
      quantity: intent.quantity,
      promotionId: intent.promotionId,
      offerGroupId: intent.offerGroupId,
    })),
    channel: "onsite",
    onsitePromotionsEnabled: true,
  }), [intents, menu, promotions]);

  const entries = useMemo<CartEntry[]>(() => {
    if (!pricing.ok) return [];
    const unused = [...intents];
    return pricing.lines.map((line) => {
      const index = unused.findIndex((intent) => intent.productId === line.productId && intent.offerGroupId === line.offerGroupId);
      const intent = index >= 0 ? unused.splice(index, 1)[0] : null;
      const product = menu.find((item) => item.id === line.productId);
      return {
        id: intent?.id ?? `${line.offerGroupId ?? "line"}-${line.productId}`,
        product_id: line.productId,
        product_name: product?.name ?? "Producto",
        unit_price: line.unitPrice,
        list_unit_price: line.listUnitPrice,
        quantity: line.quantity,
        promotion_id: line.promotionId,
        promotion_name: line.promotionName,
        offer_group_id: line.offerGroupId,
      };
    });
  }, [intents, menu, pricing]);

  const total = pricing.ok ? pricing.total : 0;
  const listTotal = pricing.ok ? pricing.listTotal : 0;
  const savings = pricing.ok ? pricing.savings : 0;
  const itemCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const quantitiesByProduct = useMemo(() => entries.reduce<Record<string, number>>((map, entry) => {
    map[entry.product_id] = (map[entry.product_id] ?? 0) + entry.quantity;
    return map;
  }, {}), [entries]);

  function setCustomerNote(note: string) {
    setCustomerNoteState(note.slice(0, 500));
  }

  function addMany(productId: string, quantity: number) {
    if (!menu.some((product) => product.id === productId) || quantity <= 0) return;
    setIntents((current) => {
      const standalone = current.find((line) => line.productId === productId && !line.offerGroupId);
      return standalone
        ? current.map((line) => line.id === standalone.id ? { ...line, quantity: line.quantity + quantity } : line)
        : [...current, { id: crypto.randomUUID(), productId, quantity, promotionId: null, offerGroupId: null }];
    });
  }

  function add(productId: string) {
    addMany(productId, 1);
  }

  function addPromotion(promotion: QrPromotion) {
    if (promotion.type !== "bundle_price" && promotion.type !== "nxm") return;
    const eligible = promotion.promotion_items.length > 0
      ? promotion.promotion_items.map((item) => item.product_id)
      : [...(promotion.product_ids ?? []), ...(promotion.bundle_product_ids ?? [])];
    const eligibleIds = new Set(eligible);
    const plan = planPromotionGroup(
      promotion,
      new Map(menu.filter((product) => eligibleIds.has(product.id)).map((product) => [product.id, Number(product.price)])),
      eligible[0],
    );
    if (!plan.ok) {
      setError(plan.error.message);
      return;
    }
    const groupId = crypto.randomUUID();
    setIntents((current) => [
      ...current,
      ...plan.data.map((line) => ({
        id: crypto.randomUUID(),
        productId: line.productId,
        quantity: line.unitQuantity,
        promotionId: promotion.id,
        offerGroupId: groupId,
      })),
    ]);
    setError(null);
  }

  function decrement(productId: string) {
    setIntents((current) => {
      const standalone = current.find((line) => line.productId === productId && !line.offerGroupId);
      if (standalone) {
        return standalone.quantity > 1
          ? current.map((line) => line.id === standalone.id ? { ...line, quantity: line.quantity - 1 } : line)
          : current.filter((line) => line.id !== standalone.id);
      }
      const grouped = current.find((line) => line.productId === productId && line.offerGroupId);
      return grouped ? current.filter((line) => line.offerGroupId !== grouped.offerGroupId) : current;
    });
  }

  function remove(entryId: string) {
    setIntents((current) => {
      const target = current.find((line) => line.id === entryId);
      return target?.offerGroupId
        ? current.filter((line) => line.offerGroupId !== target.offerGroupId)
        : current.filter((line) => line.id !== entryId);
    });
  }

  async function send() {
    if (!displayName || entries.length === 0 || !pricing.ok) return false;
    setSaving(true);
    setError(null);
    try {
      await sendItems({
        qrToken,
        fingerprint,
        displayName,
        customerPhone,
        customerNote,
        expectedTotal: total,
        items: entries.map((entry) => ({
          product_id: entry.product_id,
          quantity: entry.quantity,
          promotion_id: entry.promotion_id,
          offer_group_id: entry.offer_group_id,
        })),
      });
      setIntents([]);
      setCustomerNoteState("");
      setConfirmation(true);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo enviar el pedido");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    entries, total, listTotal, savings, itemCount, quantitiesByProduct,
    customerNote, saving, error, confirmation, setCustomerNote,
    add, addMany, addPromotion, decrement, remove, send,
    dismissConfirmation: () => setConfirmation(false),
  };
}
