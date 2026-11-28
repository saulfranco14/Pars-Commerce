import { describe, expect, it } from "vitest";
import { studioOwnPhotos } from "./photos";

const own =
  "https://x.supabase.co/storage/v1/object/public/product-images/t/p.webp";

describe("Studio product photos", () => {
  it("treats starter-catalog icons as no photo", () => {
    expect(
      studioOwnPhotos(["/catalog/starter/abarrotes/refrescos.webp"]),
    ).toEqual([]);
    expect(
      studioOwnPhotos(["https://tlaco.app/catalog/starter-product.svg", null]),
    ).toEqual([]);
  });

  it("keeps the business photos and falls back only when there are none", () => {
    expect(studioOwnPhotos([own, "/catalog/starter/abarrotes.webp"])).toEqual([
      own,
    ]);
    expect(studioOwnPhotos(["/catalog/starter/abarrotes.webp"], [own])).toEqual(
      [own],
    );
    expect(studioOwnPhotos([own], ["https://other/p.webp"])).toEqual([own]);
  });
});
