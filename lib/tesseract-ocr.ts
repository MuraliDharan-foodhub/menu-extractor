import { createWorker } from "tesseract.js";

export async function extractTextWithTesseract(
  imageBase64: string
): Promise<{ rawText: string; confidence: number }> {
  // Decode base64 to a Buffer so Tesseract can process it server-side
  const imageBuffer = Buffer.from(imageBase64, "base64");

  const worker = await createWorker("eng", 1, {
    // Suppress verbose Tesseract logging in production
    logger: () => {},
    errorHandler: (err: unknown) => {
      console.error("Tesseract error:", err);
    },
  });

  try {
    const {
      data: { text, confidence },
    } = await worker.recognize(imageBuffer);

    return {
      rawText: text.trim(),
      // Tesseract reports confidence as 0-100; normalise to 0-1
      confidence: Math.min(1, Math.max(0, confidence / 100)),
    };
  } finally {
    await worker.terminate();
  }
}
