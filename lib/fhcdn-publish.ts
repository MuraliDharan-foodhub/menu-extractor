import type { ExtractedMenu } from "@/types/menu";

const BASE_URL = "https://sit-api.fhcdn.dev";
const DEFAULT_OFFER_TYPE = "NONE";

function getApiToken(): string | null {
  return process.env.FHCDN_API_TOKEN ?? null;
}

async function postForm(
  path: string,
  apiToken: string,
  params: Record<string, string>
): Promise<unknown> {
  const body = new URLSearchParams(params);
  const response = await fetch(
    `${BASE_URL}${path}?api_token=${encodeURIComponent(apiToken)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed (${response.status}): ${text}`);
  }
  return response.json();
}

interface FhcdnIdResponse {
  id: number;
  [key: string]: unknown;
}

export interface PublishResult {
  published: boolean;
  categoriesCreated: number;
  itemsCreated: number;
  errors: string[];
}

/**
 * Publishes an extracted menu to the FoodHub CDN API.
 *
 * Mapping:
 *   MenuCategory  → Category + Subcat (same name, subcat nested under category)
 *   MenuItem      → Item under the Subcat
 *
 * Requires FHCDN_API_TOKEN env var. Returns a summary result even on partial
 * failure so callers can report progress to the user.
 */
export async function publishMenu(menu: ExtractedMenu): Promise<PublishResult> {
  const apiToken = getApiToken();
  if (!apiToken) {
    return {
      published: false,
      categoriesCreated: 0,
      itemsCreated: 0,
      errors: ["FHCDN_API_TOKEN is not configured"],
    };
  }

  let categoriesCreated = 0;
  let itemsCreated = 0;
  const errors: string[] = [];

  for (const category of menu.categories) {
    let categoryId: number;
    try {
      const catRes = (await postForm("/category", apiToken, {
        name: category.name,
      })) as FhcdnIdResponse;
      categoryId = catRes.id;
      categoriesCreated++;
    } catch (err) {
      errors.push(
        `Category "${category.name}": ${err instanceof Error ? err.message : String(err)}`
      );
      continue;
    }

    let subcatId: number;
    try {
      const subcatRes = (await postForm("/subcat", apiToken, {
        category: String(categoryId),
        name: category.name,
      })) as FhcdnIdResponse;
      subcatId = subcatRes.id;
    } catch (err) {
      errors.push(
        `Subcat "${category.name}": ${err instanceof Error ? err.message : String(err)}`
      );
      continue;
    }

    for (const item of category.items) {
      try {
        await postForm("/items", apiToken, {
          name: item.name,
          subcat: String(subcatId),
          price: String(item.price),
          offer: DEFAULT_OFFER_TYPE,
        });
        itemsCreated++;
      } catch (err) {
        errors.push(
          `Item "${item.name}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  return {
    published: errors.length === 0,
    categoriesCreated,
    itemsCreated,
    errors,
  };
}
