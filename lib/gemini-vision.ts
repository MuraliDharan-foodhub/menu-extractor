import type { ExtractedMenu, MenuCategory, MenuItem } from "@/types/menu";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const UNKNOWN_CATEGORY_NAME = "Unknown";

/**
 * Schema for Gemini structured menu extraction.
 * The prompt instructs Gemini to return JSON matching this shape.
 */
interface GeminiExtractedItem {
  name: string;
  description?: string;
  price: number; // decimal, e.g. 12.50
  dietaryTags?: string[];
}

interface GeminiExtractedSubcategory {
  name: string;
  items: GeminiExtractedItem[];
}

interface GeminiExtractedCategory {
  name: string;
  subcategories: GeminiExtractedSubcategory[];
}

interface GeminiMenuResponse {
  categories: GeminiExtractedCategory[];
  currency: string;
}

/**
 * Builds the prompt that instructs Gemini to extract a structured menu.
 */
function buildExtractionPrompt(): string {
  return `You are a menu extraction assistant. Analyze this menu image and extract all items into a structured JSON format.

RULES:
1. Every item MUST have a "name" (string, required) and "price" (number with 2 decimal places, required)
2. Group items by category and subcategory where visible
3. If you cannot determine a category or subcategory for an item, place it under category "${UNKNOWN_CATEGORY_NAME}" with subcategory "${UNKNOWN_CATEGORY_NAME}"
4. Detect the currency from symbols (£ = GBP, € = EUR, $ = USD) or default to USD
5. Extract dietary tags if visible: V (vegetarian), VG (vegan), GF (gluten-free), DF (dairy-free), N (contains nuts), S (spicy), H (halal), K (kosher)
6. Prices must be positive numbers with exactly 2 decimal places (e.g., 12.50, not 12.5)

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "categories": [
    {
      "name": "Category Name",
      "subcategories": [
        {
          "name": "Subcategory Name",
          "items": [
            {
              "name": "Item Name",
              "description": "Optional description",
              "price": 12.50,
              "dietaryTags": ["V", "GF"]
            }
          ]
        }
      ]
    }
  ],
  "currency": "USD"
}

If no clear subcategories exist, use the category name as the subcategory name.
If no menu items are found, return: {"categories": [], "currency": "USD"}`;
}

/**
 * Call Gemini API with an image for menu extraction.
 */
async function callGeminiApi(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<GeminiMenuResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Set it in your environment variables."
    );
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: buildExtractionPrompt() },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1, // Low temperature for consistent extraction
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no content");
  }

  // Parse JSON from response (strip markdown code blocks if present)
  let jsonStr = text.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    return JSON.parse(jsonStr) as GeminiMenuResponse;
  } catch (parseError) {
    const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`Failed to parse Gemini response as JSON: ${errorMsg}. Response preview: ${jsonStr.slice(0, 500)}`);
  }
}

/**
 * Validates and normalizes a price to decimal(10,2) format.
 * Returns 0.00 if invalid.
 */
function normalizePrice(price: unknown): number {
  if (typeof price !== "number" || isNaN(price) || price < 0) {
    return 0;
  }
  // Round to 2 decimal places
  return Math.round(price * 100) / 100;
}

/**
 * Convert Gemini response to ExtractedMenu format.
 * Flattens subcategories into our MenuCategory structure.
 */
function convertToExtractedMenu(
  geminiResponse: GeminiMenuResponse,
  rawText: string
): ExtractedMenu {
  const categories: MenuCategory[] = [];
  let totalItems = 0;
  let validItems = 0;

  for (const cat of geminiResponse.categories) {
    for (const subcat of cat.subcategories) {
      // Create a category for each subcategory (flattening the hierarchy)
      // Use "Category > Subcategory" naming if they differ
      const categoryName =
        cat.name === subcat.name
          ? cat.name
          : `${cat.name} > ${subcat.name}`;

      const items: MenuItem[] = [];

      for (const item of subcat.items) {
        totalItems++;
        const name = item.name?.trim();
        const price = normalizePrice(item.price);

        // Skip items without a name (mandatory)
        if (!name) {
          continue;
        }

        validItems++;
        items.push({
          id: crypto.randomUUID(),
          name,
          description: item.description?.trim() ?? "",
          price,
          dietaryTags: Array.isArray(item.dietaryTags) ? item.dietaryTags : [],
          available: true,
          confidence: price > 0 ? 0.95 : 0.7, // Higher confidence if price was extracted
        });
      }

      if (items.length > 0) {
        categories.push({
          id: crypto.randomUUID(),
          name: categoryName,
          items,
        });
      }
    }
  }

  // Calculate extraction confidence based on valid items ratio
  const extractionConfidence =
    totalItems > 0 ? Math.min(0.95, (validItems / totalItems) * 0.9 + 0.1) : 0.5;

  return {
    categories,
    currency: geminiResponse.currency || "USD",
    extractionConfidence,
    rawText,
  };
}

/**
 * Extract menu from image using Google Gemini API.
 * Returns structured menu data with categories, subcategories, and items.
 */
export async function extractMenuWithGemini(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ExtractedMenu> {
  const geminiResponse = await callGeminiApi(imageBase64, mimeType);

  // Generate a summary rawText for compatibility
  const rawText = generateRawTextSummary(geminiResponse);

  return convertToExtractedMenu(geminiResponse, rawText);
}

/**
 * Generate a text summary from the extracted menu for rawText field.
 */
function generateRawTextSummary(response: GeminiMenuResponse): string {
  const lines: string[] = [];

  for (const cat of response.categories) {
    lines.push(`[${cat.name}]`);
    for (const subcat of cat.subcategories) {
      if (subcat.name !== cat.name) {
        lines.push(`  ${subcat.name}:`);
      }
      for (const item of subcat.items) {
        const desc = item.description ? ` - ${item.description}` : "";
        const tags = item.dietaryTags?.length
          ? ` (${item.dietaryTags.join(", ")})`
          : "";
        lines.push(`    ${item.name}${desc} ${item.price.toFixed(2)}${tags}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Check if an item belongs to the "Unknown" category.
 */
export function isUnknownCategory(categoryName: string): boolean {
  return (
    categoryName === UNKNOWN_CATEGORY_NAME ||
    categoryName.startsWith(`${UNKNOWN_CATEGORY_NAME} >`)
  );
}

export { UNKNOWN_CATEGORY_NAME };
