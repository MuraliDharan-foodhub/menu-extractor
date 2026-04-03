import { NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/google-vision";
import { extractTextWithTesseract } from "@/lib/tesseract-ocr";
import { extractMenuWithGemini } from "@/lib/gemini-vision";
import { parseMenuText } from "@/lib/menuParser";

/**
 * Supported OCR engine values for the OCR_ENGINE env variable.
 * - "google": Google Cloud Vision API (text extraction + rule-based parsing)
 * - "tesseract": Tesseract.js (local OCR + rule-based parsing)
 * - "gemini": Google Gemini API (AI-powered structured extraction)
 */
type OcrEngine = "google" | "tesseract" | "gemini";

function getOcrEngine(): OcrEngine {
  const val = (process.env.OCR_ENGINE ?? "google").toLowerCase();
  if (val === "tesseract") return "tesseract";
  if (val === "gemini") return "gemini";
  return "google";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const engine = getOcrEngine();

    // Gemini uses direct AI extraction (no separate OCR + parsing steps)
    if (engine === "gemini") {
      const menu = await extractMenuWithGemini(base64, file.type);
      if (menu.categories.length === 0) {
        return NextResponse.json(
          { error: "No menu items found in the image. Please try a clearer menu photo." },
          { status: 422 }
        );
      }
      return NextResponse.json(menu);
    }

    // Google Vision or Tesseract: OCR + rule-based parsing
    const { rawText, confidence } =
      engine === "tesseract"
        ? await extractTextWithTesseract(base64)
        : await extractTextFromImage(base64);

    if (!rawText) {
      return NextResponse.json(
        { error: "No text found in the image. Please try a clearer menu photo." },
        { status: 422 }
      );
    }

    const menu = parseMenuText(rawText, confidence);
    return NextResponse.json(menu);
  } catch (error) {
    console.error("Extraction error:", error);
    const message =
      error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
