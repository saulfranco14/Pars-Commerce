export interface PromotionCollageLabel {
  kicker: string;
  label: string;
}

export interface PromotionCollageProps extends PromotionCollageLabel {
  /** Up to three product photos; none renders a branded block with an icon. */
  images: string[];
}
