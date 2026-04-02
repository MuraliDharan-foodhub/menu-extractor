const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

export async function extractTextFromImage(
  imageBase64: string
): Promise<{ rawText: string; confidence: number }> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
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
