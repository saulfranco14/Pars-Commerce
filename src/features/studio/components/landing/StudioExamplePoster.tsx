import Image from "next/image";
import type { StudioExample } from "../../constants/marketing";
import styles from "./studioMarketing.module.css";

export function StudioExamplePoster({
  example,
  format = "portrait",
  priority = false,
  selected = false,
  animate = false,
  layout = "classic",
}: {
  example: StudioExample;
  format?: "portrait" | "square" | "story";
  priority?: boolean;
  selected?: boolean;
  animate?: boolean;
  layout?: "classic" | "editorial" | "framed";
}) {
  return (
    <div
      className={`${styles.poster} ${styles[format]} ${layout === "classic" ? "" : styles[layout]} ${example.tone === "cream" ? styles.cream : styles.night} ${animate ? styles.buildPoster : ""}`}
    >
      <Image
        src={example.image}
        alt={example.alt}
        fill
        sizes="(max-width: 640px) 75vw, (max-width: 1024px) 40vw, 440px"
        priority={priority}
        className={styles.posterPhoto}
      />
      <div className={styles.posterShade} />
      <div className={styles.posterContent}>
        <p className={styles.posterBrand}>{example.business}</p>
        <p className={styles.posterHeadline}>{example.headline}</p>
        <div className={styles.posterOffer}>
          <p className={styles.posterDetail}>{example.detail}</p>
          <p
            className={`${styles.posterPrice} ${selected ? styles.selectedPrice : ""}`}
          >
            {example.price}
          </p>
          <p className={styles.posterNote}>{example.note}</p>
        </div>
      </div>
    </div>
  );
}
