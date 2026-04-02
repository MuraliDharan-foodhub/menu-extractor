const GOOGLE_OAUTH2_TOKEN_URL = "https://oauth2.googleapis.com/token";
const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

export async function refreshAccessToken(): Promise<string> {
  const response = await fetch(GOOGLE_OAUTH2_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function extractTextFromImage(
  imageBase64: string
): Promise<{ rawText: string; confidence: number }> {
  const accessToken = await refreshAccessToken();

  const response = await fetch(VISION_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vision API error: ${error}`);
  }

  const data = (await response.json()) as {
    responses?: Array<{
      textAnnotations?: Array<{ description: string }>;
      fullTextAnnotation?: {
        pages?: Array<{ confidence: number }>;
      };
    }>;
  };

  const textAnnotations = data.responses?.[0]?.textAnnotations;

  if (!textAnnotations || textAnnotations.length === 0) {
    return { rawText: "", confidence: 0 };
  }

  const rawText = textAnnotations[0].description ?? "";
  const confidence =
    data.responses?.[0]?.fullTextAnnotation?.pages?.[0]?.confidence ?? 0.8;

  return { rawText, confidence };
}
