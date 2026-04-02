import type { ExtractedMenu, MenuCategory, MenuItem } from "@/types/menu";

const DIETARY_PATTERNS: Record<string, RegExp> = {
  V: /\bV\b(?!G)/,
  VG: /\bVG\b|\bvegan\b/i,
  GF: /\bGF\b|\bgluten.?free\b/i,
  DF: /\bDF\b|\bdairy.?free\b/i,
  N: /\bN\b|\bnuts?\b|\bcontains nuts\b/i,
  S: /\bS\b|\bspicy\b/i,
  H: /\bH\b|\bhalal\b/i,
  K: /\bK\b|\bkosher\b/i,
};

const CATEGORY_PATTERNS = [
  /^[A-Z][A-Z\s&''-]{2,48}$/,
  /^.{2,48}:$/,
  /^(starters?|appetizers?|mains?|entr[eé]es?|desserts?|drinks?|beverages?|sides?|salads?|soups?|specials?|sharing|platters?|sandwiches|burgers?|pizza|pasta|seafood|grill|vegetarian|vegan|kids?)\s*$/i,
];

const PRICE_PATTERN =
  /(?:^|\s)([\$£€])\s?(\d{1,3}(?:[.,]\d{2})?)|(\d{1,3}(?:[.,]\d{2})?)\s?([\$£€])|(\d{1,3}\.\d{2})\b/;

function detectCurrency(text: string): string {
  if (text.includes("£")) return "GBP";
  if (text.includes("€")) return "EUR";
  return "USD";
}

function isCategoryHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  return CATEGORY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function extractPrice(line: string): number | null {
  const match = line.match(PRICE_PATTERN);
  if (!match) return null;
  const numStr = match[2] ?? match[3] ?? match[5] ?? null;
  if (!numStr) return null;
  return parseFloat(numStr.replace(",", "."));
}

function extractDietaryTags(text: string): string[] {
  const tags: string[] = [];
  for (const [tag, pattern] of Object.entries(DIETARY_PATTERNS)) {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  }
  return tags;
}

function stripPriceAndTags(line: string): string {
  let result = line
    .replace(/[\$£€]\s?\d{1,3}(?:[.,]\d{2})?/g, "")
    .replace(/\d{1,3}\.\d{2}/g, "")
    .replace(/\b(VG|GF|DF|[VNSHK])\b/g, "")
    .replace(/\bvegan\b|\bgluten.?free\b|\bdairy.?free\b|\bspicy\b|\bhalal\b|\bkosher\b/gi, "")
    .trim();
  // Remove trailing punctuation
  result = result.replace(/[,.\-–—]+$/, "").trim();
  return result;
}

function hasPrice(line: string): boolean {
  return PRICE_PATTERN.test(line);
}

function calculateItemConfidence(name: string, price: number | null): number {
  let confidence = 0.7;
  if (name.length > 2) confidence += 0.1;
  if (price !== null && price > 0) confidence += 0.15;
  if (name.length > 5 && name.length < 50) confidence += 0.05;
  return Math.min(confidence, 1.0);
}

export function parseMenuText(
  rawText: string,
  overallConfidence: number = 0.8
): ExtractedMenu {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const currency = detectCurrency(rawText);
  const categories: MenuCategory[] = [];
  let currentCategory: MenuCategory | null = null;
  let pendingItemName: string | null = null;
  let pendingDescription: string[] = [];
  // Track last placed item so we can append a following description line to it
  let lastPlacedItem: MenuItem | null = null;

  function flushPendingItem(price: number | null = null) {
    if (!pendingItemName || !currentCategory) return;
    const name = pendingItemName;
    const description = pendingDescription.join(" ").trim();
    const allText = `${name} ${description}`;
    const item: MenuItem = {
      id: crypto.randomUUID(),
      name,
      description,
      price: price ?? 0,
      dietaryTags: extractDietaryTags(allText),
      available: true,
      confidence: calculateItemConfidence(name, price),
    };
    currentCategory.items.push(item);
    lastPlacedItem = item;
    pendingItemName = null;
    pendingDescription = [];
  }

  function ensureDefaultCategory() {
    if (!currentCategory) {
      currentCategory = {
        id: crypto.randomUUID(),
        name: "Menu Items",
        items: [],
      };
      categories.push(currentCategory);
    }
  }

  for (const line of lines) {
    if (isCategoryHeader(line)) {
      flushPendingItem();
      lastPlacedItem = null;
      const catName = line.endsWith(":") ? line.slice(0, -1).trim() : line;
      currentCategory = {
        id: crypto.randomUUID(),
        name: catName,
        items: [],
      };
      categories.push(currentCategory);
      continue;
    }

    if (hasPrice(line)) {
      const price = extractPrice(line);
      const cleanName = stripPriceAndTags(line);
      lastPlacedItem = null;

      if (pendingItemName) {
        // Current line has the price for the pending item
        if (cleanName.length > 1 && cleanName !== pendingItemName) {
          // This line has both a new item name and price
          flushPendingItem();
          ensureDefaultCategory();
          const item: MenuItem = {
            id: crypto.randomUUID(),
            name: cleanName,
            description: "",
            price: price ?? 0,
            dietaryTags: extractDietaryTags(line),
            available: true,
            confidence: calculateItemConfidence(cleanName, price),
          };
          currentCategory!.items.push(item);
          lastPlacedItem = item;
        } else {
          flushPendingItem(price);
        }
      } else {
        flushPendingItem();
        ensureDefaultCategory();
        if (cleanName.length > 1) {
          const item: MenuItem = {
            id: crypto.randomUUID(),
            name: cleanName,
            description: "",
            price: price ?? 0,
            dietaryTags: extractDietaryTags(line),
            available: true,
            confidence: calculateItemConfidence(cleanName, price),
          };
          currentCategory!.items.push(item);
          lastPlacedItem = item;
        }
      }
      continue;
    }

    // No price — could be item name or description
    const stripped = stripPriceAndTags(line);
    if (stripped.length < 2) continue;

    if (pendingItemName) {
      // Treat as description continuation
      pendingDescription.push(stripped);
    } else if (lastPlacedItem) {
      // Append as description to the last placed item and pick up any dietary tags
      lastPlacedItem.description = lastPlacedItem.description
        ? `${lastPlacedItem.description} ${stripped}`
        : stripped;
      // Merge dietary tags from the description line
      const newTags = extractDietaryTags(line);
      for (const tag of newTags) {
        if (!lastPlacedItem.dietaryTags.includes(tag)) {
          lastPlacedItem.dietaryTags.push(tag);
        }
      }
      // lastPlacedItem stays so further description lines also attach
    } else {
      // Treat as potential item name
      ensureDefaultCategory();
      pendingItemName = stripped;
      pendingDescription = [];
    }
  }

  // Flush any remaining pending item
  flushPendingItem();

  // Remove empty categories
  const nonEmpty = categories.filter(
    (c) => c.items.length > 0 && c.name !== "Menu Items"
  );

  return {
    categories: nonEmpty.length > 0 ? nonEmpty : categories,
    currency,
    extractionConfidence: overallConfidence,
    rawText,
  };
}
