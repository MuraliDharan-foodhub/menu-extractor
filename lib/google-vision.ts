const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";
const GOOGLE_OAUTH2_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Obtain an access token using the OAuth2 refresh token flow.
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN env vars.
 */
async function refreshAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "OAuth2 credentials missing. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN."
    );
  }

  const res = await fetch(GOOGLE_OAUTH2_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Token refresh returned no access_token");
  }
  return json.access_token;
}

/**
 * Build the Authorization header for Vision API requests.
 * Prefers OAuth2 (clientId/clientSecret/refreshToken) when available,
 * falls back to GOOGLE_API_KEY query-param authentication.
 */
async function buildVisionRequest(
  imageBase64: string
): Promise<{ url: string; headers: Record<string, string>; body: string }> {
  const body = JSON.stringify({
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
      },
    ],
  });

  const hasOAuth2 =
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN;

  if (hasOAuth2) {
    const accessToken = await refreshAccessToken();
    return {
      url: VISION_API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No Google credentials found. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REFRESH_TOKEN " +
        "for OAuth2, or GOOGLE_API_KEY for API-key authentication."
    );
  }

  return {
    url: `${VISION_API_URL}?key=${apiKey}`,
    headers: { "Content-Type": "application/json" },
    body,
  };
}

export async function extractTextFromImage(
  imageBase64: string
): Promise<{ rawText: string; confidence: number }> {
  const { url, headers, body } = await buildVisionRequest(imageBase64);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
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
