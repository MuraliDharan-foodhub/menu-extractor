import { parseMenuText } from "@/lib/menuParser";

const SAMPLE_MENU = `
STARTERS
Soup of the Day
Fresh seasonal soup served with crusty bread
$6.50

Bruschetta                    $8.00
Toasted ciabatta with tomatoes, basil V GF

MAINS
Grilled Salmon                $22.00
Atlantic salmon with lemon butter sauce GF DF

Margherita Pizza              $14.00
Classic tomato and mozzarella V

Beef Burger                   $16.50
8oz beef patty with fries

DESSERTS
Chocolate Fondant             $9.00
Warm chocolate cake with ice cream V

Sorbet                        $7.00
Daily selection VG GF DF
`;

describe("parseMenuText", () => {
  const menu = parseMenuText(SAMPLE_MENU, 0.9);

  test("detects categories", () => {
    const names = menu.categories.map((c) => c.name);
    expect(names).toContain("STARTERS");
    expect(names).toContain("MAINS");
    expect(names).toContain("DESSERTS");
  });

  test("extracts prices correctly", () => {
    const starters = menu.categories.find((c) => c.name === "STARTERS");
    expect(starters).toBeDefined();
    const soup = starters?.items.find((i) => i.name.toLowerCase().includes("soup"));
    expect(soup?.price).toBe(6.5);

    const bruschetta = starters?.items.find((i) =>
      i.name.toLowerCase().includes("bruschetta")
    );
    expect(bruschetta?.price).toBe(8.0);
  });

  test("extracts dietary tags", () => {
    const mains = menu.categories.find((c) => c.name === "MAINS");
    const pizza = mains?.items.find((i) =>
      i.name.toLowerCase().includes("pizza")
    );
    expect(pizza?.dietaryTags).toContain("V");

    const salmon = mains?.items.find((i) =>
      i.name.toLowerCase().includes("salmon")
    );
    expect(salmon?.dietaryTags).toContain("GF");
    expect(salmon?.dietaryTags).toContain("DF");
  });

  test("returns overall extraction confidence", () => {
    expect(menu.extractionConfidence).toBe(0.9);
  });

  test("returns rawText", () => {
    expect(menu.rawText).toContain("STARTERS");
  });

  test("detects USD currency", () => {
    expect(menu.currency).toBe("USD");
  });

  test("handles empty text gracefully", () => {
    const empty = parseMenuText("");
    expect(empty.categories).toHaveLength(0);
    expect(empty.rawText).toBe("");
  });

  test("detects GBP currency", () => {
    const gbpMenu = parseMenuText("STARTERS\nFish & Chips £10.00");
    expect(gbpMenu.currency).toBe("GBP");
  });

  test("detects EUR currency", () => {
    const eurMenu = parseMenuText("MAINS\nPasta €12.50");
    expect(eurMenu.currency).toBe("EUR");
  });

  test("handles multi-line descriptions", () => {
    const text = `MAINS\nGrilled Chicken\nFree-range chicken with seasonal vegetables\n$15.00`;
    const result = parseMenuText(text, 0.8);
    const main = result.categories[0];
    expect(main).toBeDefined();
    const item = main?.items[0];
    expect(item?.name).toContain("Grilled Chicken");
  });

  test("item confidence is between 0 and 1", () => {
    for (const category of menu.categories) {
      for (const item of category.items) {
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  test("all items have required fields", () => {
    for (const category of menu.categories) {
      for (const item of category.items) {
        expect(typeof item.id).toBe("string");
        expect(typeof item.name).toBe("string");
        expect(typeof item.description).toBe("string");
        expect(typeof item.price).toBe("number");
        expect(Array.isArray(item.dietaryTags)).toBe(true);
        expect(typeof item.available).toBe("boolean");
      }
    }
  });
});
